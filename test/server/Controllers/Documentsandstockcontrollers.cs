using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;
using StockApi.Services;
using System.Linq.Expressions;
using System.Reflection.Metadata;
using System.Xml.Linq;

namespace StockApi.Controllers;

[ApiController, Route("api/documents"), Tags("Документы")]
public class DocumentsController(StockDbContext db, PostingService posting, BusinessClock clock) : ControllerBase
{
    [HttpGet]
    public Task<List<DocumentListItemDto>> List(
        [FromQuery] DocumentType? type, [FromQuery] DocumentStatus? status,
        [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to, CancellationToken ct)
    {
        var q = db.Documents.AsQueryable();
        if (type is not null) q = q.Where(d => d.Type == type);
        if (status is not null) q = q.Where(d => d.Status == status);
        else q = q.Where(d => d.Status != DocumentStatus.Deleted);
        if (from is not null) { var f = from.Value.UtcDateTime; q = q.Where(d => d.DocDate >= f); }
        if (to is not null) { var t = to.Value.UtcDateTime; q = q.Where(d => d.DocDate <= t); }

        return q.OrderByDescending(d => d.DocDate)
            .Select(d => new DocumentListItemDto(d.Id, d.Type, d.Number, d.DocDate, d.Status, d.StoreId,
                d.Items.Sum(i => i.Amount ?? 0)))
            .ToListAsync(ct);
    }

    [HttpGet("{id:guid}")]
    public async Task<DocumentDto> Get(Guid id, CancellationToken ct)
    {
        var d = await db.Documents
                    .Include(x => x.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Unit)
                    .FirstOrDefaultAsync(x => x.Id == id, ct)
                ?? throw DomainException.NotFound("Документ");
        return ToDto(d);
    }

    // Создаёт черновик. На остатки не влияет, пока не проведёшь.
    [HttpPost]
    public async Task<DocumentDto> Create(CreateDocumentRequest req, CancellationToken ct)
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
                break;
            case DocumentType.Transfer:
                if (req.StoreToId is null || req.StoreToId == req.StoreId ||
                    !await db.Stores.AnyAsync(s => s.Id == req.StoreToId, ct))
                    throw new DomainException("Для перемещения нужен другой существующий склад-получатель");
                break;
        }

        var minQty = req.Type == DocumentType.Inventory ? 0 : 0.000001m;
        if (req.Items.Any(i => i.Quantity < minQty))
            throw new DomainException(req.Type == DocumentType.Inventory
                ? "Фактическое количество не может быть отрицательным"
                : "Количество в строке должно быть больше нуля");

        var productIds = req.Items.Select(i => i.ProductId).Distinct().ToList();
        if (await db.Products.CountAsync(p => productIds.Contains(p.Id), ct) != productIds.Count)
            throw DomainException.NotFound("Один из товаров");

        var settings = await db.AccountingSettings.SingleAsync(ct);
        var docDateUtc = req.DocDate.UtcDateTime;
        PostingService.EnsurePeriodOpen(settings, clock.LocalDate(docDateUtc));

        var number = req.Number;
        if (string.IsNullOrWhiteSpace(number))
        {
            var existing = await db.Documents.Where(d => d.Type == req.Type).Select(d => d.Number).ToListAsync(ct);
            var max = existing.Select(n => int.TryParse(n, out var x) ? x : 0).DefaultIfEmpty(0).Max();
            number = (max + 1).ToString("D4");
        }
        else if (await db.Documents.AnyAsync(d => d.Type == req.Type && d.Number == number, ct))
        {
            throw DomainException.Conflict($"Документ этого типа с номером {number} уже есть");
        }

        var now = DateTime.UtcNow;
        var doc = new StockApi.Data.Document
        {
            Id = Guid.NewGuid(),
            Type = req.Type,
            Number = number,
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

    // Пометить черновик удалённым (из базы не стираем, как iiko)
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

    [HttpPost("{id:guid}/post")]
    public async Task<DocumentDto> Post(Guid id, CancellationToken ct)
    {
        await posting.PostAsync(id, ct);
        return await Get(id, ct);
    }

    [HttpPost("{id:guid}/unpost")]
    public async Task<DocumentDto> Unpost(Guid id, CancellationToken ct)
    {
        await posting.UnpostAsync(id, ct);
        return await Get(id, ct);
    }

    // Какие движения породил документ
    [HttpGet("{id:guid}/movements")]
    public Task<List<MovementDto>> Movements(Guid id, CancellationToken ct) =>
        StockController.MovementsQuery(db, m => m.DocumentId == id).ToListAsync(ct);

    private static DocumentDto ToDto(StockApi.Data.Document d) => new(
        d.Id, d.Type, d.Number, d.DocDate, d.Status, d.StoreId, d.StoreToId, d.SupplierId,
        d.WriteoffReason, d.Comment, d.IsAutomatic, d.CreatedAt, d.PostedAt,
        d.Items.Sum(i => i.Amount ?? 0),
        d.Items.OrderBy(i => i.LineNo).Select(i => new DocumentItemDto(
            i.Id, i.LineNo, i.ProductId, i.Product.Name, i.Product.Unit.ShortName,
            i.Quantity, i.Price, i.Amount)).ToList());
}

[ApiController, Route("api/stock"), Tags("Остатки")]
public class StockController(StockDbContext db) : ControllerBase
{
    // Текущие остатки
    [HttpGet("balances")]
    public Task<List<BalanceDto>> Balances([FromQuery] Guid? storeId, CancellationToken ct) =>
        (from b in db.StockBalances
         join s in db.Stores on b.StoreId equals s.Id
         join p in db.Products on b.ProductId equals p.Id
         where storeId == null || b.StoreId == storeId
         orderby s.Name, p.Name
         select new BalanceDto(s.Id, s.Name, p.Id, p.Name, p.Unit.ShortName, b.Quantity, b.TotalCost,
             b.Quantity > 0 ? (decimal?)Math.Round(b.TotalCost / b.Quantity, 2) : null))
        .ToListAsync(ct);

    // Остатки на момент времени — сумма движений до него
    [HttpGet("balances/on-date")]
    public async Task<List<BalanceDto>> BalancesOnDate([FromQuery] DateTimeOffset at, [FromQuery] Guid? storeId, CancellationToken ct)
    {
        var atUtc = at.UtcDateTime;
        var sums = await db.StockMovements
            .Where(m => m.MovementDate <= atUtc && (storeId == null || m.StoreId == storeId))
            .GroupBy(m => new { m.StoreId, m.ProductId })
            .Select(g => new { g.Key.StoreId, g.Key.ProductId, Qty = g.Sum(x => x.Quantity), Cost = g.Sum(x => x.CostAmount) })
            .ToListAsync(ct);

        var stores = await db.Stores.ToDictionaryAsync(s => s.Id, s => s.Name, ct);
        var products = await db.Products
            .Select(p => new { p.Id, p.Name, Unit = p.Unit.ShortName })
            .ToDictionaryAsync(p => p.Id, ct);

        return sums
            .Select(x => new BalanceDto(x.StoreId, stores[x.StoreId], x.ProductId,
                products[x.ProductId].Name, products[x.ProductId].Unit, x.Qty, x.Cost,
                x.Qty > 0 ? Math.Round(x.Cost / x.Qty, 2) : null))
            .OrderBy(b => b.Store).ThenBy(b => b.Product)
            .ToList();
    }

    // История движений по товару/складу
    [HttpGet("movements")]
    public Task<List<MovementDto>> Movements([FromQuery] Guid? productId, [FromQuery] Guid? storeId, CancellationToken ct) =>
        MovementsQuery(db, m => (productId == null || m.ProductId == productId) && (storeId == null || m.StoreId == storeId))
            .ToListAsync(ct);

    // Сверка: остатки должны совпадать с суммой движений. Пустой ответ = всё хорошо.
    [HttpGet("check")]
    public async Task<List<ReconciliationIssueDto>> Check(CancellationToken ct)
    {
        var sums = await db.StockMovements
            .GroupBy(m => new { m.StoreId, m.ProductId })
            .Select(g => new { g.Key.StoreId, g.Key.ProductId, Qty = g.Sum(x => x.Quantity) })
            .ToListAsync(ct);
        var balances = await db.StockBalances.ToListAsync(ct);

        var fromMovements = sums.ToDictionary(x => (x.StoreId, x.ProductId), x => x.Qty);
        var keys = fromMovements.Keys.Union(balances.Select(b => (b.StoreId, b.ProductId)));

        return keys
            .Select(k => new ReconciliationIssueDto(k.StoreId, k.ProductId,
                balances.FirstOrDefault(b => b.StoreId == k.StoreId && b.ProductId == k.ProductId)?.Quantity ?? 0,
                fromMovements.GetValueOrDefault(k)))
            .Where(x => x.BalanceQuantity != x.MovementsQuantity)
            .ToList();
    }

    // Фильтр применяется ДО проекции в DTO: после проекции в record EF фильтровать не умеет
    internal static IQueryable<MovementDto> MovementsQuery(StockDbContext db, Expression<Func<StockMovement, bool>> filter) =>
        from m in db.StockMovements.Where(filter)
        join d in db.Documents on m.DocumentId equals d.Id
        join p in db.Products on m.ProductId equals p.Id
        orderby m.MovementDate, m.Id
        select new MovementDto(m.Id, m.MovementDate, d.Id, d.Type, d.Number,
            m.StoreId, m.ProductId, p.Name, m.Quantity, m.CostAmount);
}