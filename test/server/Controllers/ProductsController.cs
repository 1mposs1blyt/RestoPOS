using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;
using StockApi.Services;

namespace StockApi.Controllers;

[ApiController, Route("api/products"), Tags("Номенклатура")]
public class ProductsController(StockDbContext db) : ControllerBase
{
    /// <summary>Список номенклатуры</summary>
    /// <remarks>type — фильтр: goods (товар), dish (блюдо), prepared (заготовка), service (услуга).</remarks>
    [HttpGet]
    public Task<List<ProductDto>> List([FromQuery] ProductType? type, CancellationToken ct) =>
        // Сортируем ДО проекции в DTO, после неё EF сортировать не умеет
        Queries.ProductDtos(db.Products
                .Where(p => !p.IsDeleted && (type == null || p.Type == type))
                .OrderBy(p => p.Name))
            .ToListAsync(ct);

    /// <summary>Одна позиция номенклатуры</summary>
    [HttpGet("{id:guid}")]
    public async Task<ProductDto> Get(Guid id, CancellationToken ct) =>
        await Queries.ProductDtos(db.Products.Where(p => p.Id == id)).FirstOrDefaultAsync(ct)
        ?? throw DomainException.NotFound("Товар");

    /// <summary>Добавить товар, блюдо или заготовку</summary>
    /// <remarks>Если article не указан, сгенерируется следующий по порядку.</remarks>
    [HttpPost]
    public async Task<ProductDto> Create(CreateProductRequest req, CancellationToken ct)
    {
        var unit = await db.Units.FindAsync([req.UnitId], ct) ?? throw DomainException.NotFound("Единица измерения");

        var article = req.Article;
        if (string.IsNullOrWhiteSpace(article))
        {
            var existing = await db.Products.Select(x => x.Article).ToListAsync(ct);
            var max = existing.Select(a => int.TryParse(a, out var n) ? n : 0).DefaultIfEmpty(0).Max();
            article = (max + 1).ToString("D5");
        }
        else if (await db.Products.AnyAsync(x => x.Article == article, ct))
        {
            throw DomainException.Conflict($"Артикул {article} уже занят");
        }

        var now = DateTime.UtcNow;
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Article = article,
            Name = req.Name.Trim(),
            Type = req.Type,
            UnitId = unit.Id,
            GroupId = req.GroupId,
            // Ингредиент всегда списывается сам собой
            WriteoffMethod = req.Type == ProductType.Goods ? WriteoffMethod.Self : req.WriteoffMethod,
            SalePrice = req.SalePrice,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return await Get(product.Id, ct);
    }
}
