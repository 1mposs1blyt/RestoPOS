using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;
using StockApi.Services;

namespace StockApi.Controllers;

[ApiController, Route("api/documents"), Tags("Документы")]
public class DocumentsController(StockDbContext db, BusinessClock clock) : ControllerBase
{
    /// <summary>Список документов, новые сверху</summary>
    /// <remarks>Удалённые не показываются, если явно не попросить status=deleted.</remarks>
    [HttpGet]
    public Task<List<DocumentListItemDto>> List(
        [FromQuery] DocumentType? type, [FromQuery] DocumentStatus? status,
        [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to, CancellationToken ct)
    {
        var q = db.Documents.AsQueryable();
        if (type is not null) q = q.Where(d => d.Type == type);
        q = status is not null
            ? q.Where(d => d.Status == status)
            : q.Where(d => d.Status != DocumentStatus.Deleted);
        if (from is not null) { var f = from.Value.UtcDateTime; q = q.Where(d => d.DocDate >= f); }
        if (to is not null) { var t = to.Value.UtcDateTime; q = q.Where(d => d.DocDate <= t); }

        return q.OrderByDescending(d => d.DocDate).ThenByDescending(d => d.CreatedAt)
            .Select(d => new DocumentListItemDto(d.Id, d.Type, d.Number, d.DocDate, d.Status, d.StoreId,
                d.Items.Sum(i => i.Amount ?? 0)))
            .ToListAsync(ct);
    }

    /// <summary>Один документ со строками</summary>
    [HttpGet("{id:guid}")]
    public async Task<DocumentDto> Get(Guid id, CancellationToken ct)
    {
        var d = await db.Documents
                    .Include(x => x.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Unit)
                    .FirstOrDefaultAsync(x => x.Id == id, ct)
                ?? throw DomainException.NotFound("Документ");
        return d.ToDto();
    }

    /// <summary>Создать документ-черновик</summary>
    /// <remarks>
    /// Черновик на остатки не влияет — чтобы применить, проведи его через /post.
    ///
    /// Какие поля нужны:
    /// incoming_invoice — supplierId, у строк price или amount;
    /// transfer — storeToId (склад-получатель);
    /// inventory — в quantity фактическое количество;
    /// sales_act, writeoff_act — только storeId и строки.
    ///
    /// number можно не указывать — сгенерируется. Лишние поля лучше удалить из примера.
    /// </remarks>
    [HttpPost]
    public async Task<DocumentDto> Create(CreateDocumentRequest req, CancellationToken ct)
    {
        await ValidateAsync(req, ct);

        var settings = await db.AccountingSettings.SingleAsync(ct);
        var docDateUtc = req.DocDate.UtcDateTime;
        PostingService.EnsurePeriodOpen(settings, clock.LocalDate(docDateUtc));

        var now = DateTime.UtcNow;
        var doc = new Document
        {
            Id = Guid.NewGuid(),
            Type = req.Type,
            Number = await NumberAsync(req, ct),
            DocDate = docDateUtc,
            StoreId = req.StoreId,
            StoreToId = req.Type == DocumentType.Transfer ? req.StoreToId : null,
            SupplierId = req.Type == DocumentType.IncomingInvoice ? req.SupplierId : null,
            WriteoffReason = req.WriteoffReason,
            Comment = req.Comment,
            CreatedAt = now,
            UpdatedAt = now,
            Items = req.Items.Select((i, idx) => new DocumentItem
            {
                Id = Guid.NewGuid(),
                LineNo = idx + 1,
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                Price = i.Price,
                Amount = i.Amount ?? (i.Price is decimal price ? (decimal?)Math.Round(price * i.Quantity, 2) : null)
            }).ToList()
        };

        db.Documents.Add(doc);
        await db.SaveChangesAsync(ct);
        return await Get(doc.Id, ct);
    }

    /// <summary>Удалить черновик</summary>
    /// <remarks>Из базы не стирается, а помечается удалённым. Проведённый сначала нужно распровести.</remarks>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var doc = await db.Documents.FindAsync([id], ct) ?? throw DomainException.NotFound("Документ");
        if (doc.Status == DocumentStatus.Posted)
            throw DomainException.Conflict("Сначала отмени проведение");
        doc.Status = DocumentStatus.Deleted;
        doc.UpdatedAt = DateTime.UtcNow;
        doc.Revision++;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task ValidateAsync(CreateDocumentRequest req, CancellationToken ct)
    {
        if (req.Items.Count == 0)
            throw new DomainException("В документе нет ни одной строки");

        if (!await db.Stores.AnyAsync(s => s.Id == req.StoreId, ct))
            throw DomainException.NotFound("Склад");

        switch (req.Type)
        {
            case DocumentType.IncomingInvoice:
                if (req.SupplierId is null || !await db.Suppliers.AnyAsync(s => s.Id == req.SupplierId, ct))
                    throw new DomainException("Для приходной накладной нужен существующий поставщик");
                if (req.Items.Any(i => i.Price is null && i.Amount is null))
                    throw new DomainException("В приходной накладной у каждой строки нужна цена или сумма");
                if (req.Items.Any(i => i.Amount is <= 0 || i.Price is <= 0))
                    throw new DomainException("Цена и сумма в приходной накладной должны быть больше нуля");
                break;

            case DocumentType.Transfer:
                if (req.StoreToId is null || req.StoreToId == req.StoreId ||
                    !await db.Stores.AnyAsync(s => s.Id == req.StoreToId, ct))
                    throw new DomainException("Для перемещения нужен другой существующий склад-получатель");
                break;
        }

        if (req.Type == DocumentType.Inventory
                ? req.Items.Any(i => i.Quantity < 0)
                : req.Items.Any(i => i.Quantity <= 0))
            throw new DomainException(req.Type == DocumentType.Inventory
                ? "Фактическое количество не может быть отрицательным"
                : "Количество в строке должно быть больше нуля");

        var productIds = req.Items.Select(i => i.ProductId).Distinct().ToList();
        if (await db.Products.CountAsync(p => productIds.Contains(p.Id), ct) != productIds.Count)
            throw DomainException.NotFound("Один из товаров");
    }

    private async Task<string> NumberAsync(CreateDocumentRequest req, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(req.Number))
        {
            if (await db.Documents.AnyAsync(d => d.Type == req.Type && d.Number == req.Number, ct))
                throw DomainException.Conflict($"Документ этого типа с номером {req.Number} уже есть");
            return req.Number;
        }

        var existing = await db.Documents.Where(d => d.Type == req.Type).Select(d => d.Number).ToListAsync(ct);
        var max = existing.Select(n => int.TryParse(n, out var x) ? x : 0).DefaultIfEmpty(0).Max();
        return (max + 1).ToString("D4");
    }
}
