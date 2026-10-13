using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;
using StockApi.Services;

namespace StockApi.Controllers;

[ApiController, Route("api/units"), Tags("Справочники")]
public class UnitsController(StockDbContext db) : ControllerBase
{
    [HttpGet]
    public Task<List<UnitDto>> List(CancellationToken ct) =>
        db.Units.OrderBy(u => u.Name).Select(u => new UnitDto(u.Id, u.Name, u.ShortName)).ToListAsync(ct);

    [HttpPost]
    public async Task<UnitDto> Create(CreateUnitRequest req, CancellationToken ct)
    {
        var unit = new Unit { Id = Guid.NewGuid(), Name = req.Name.Trim(), ShortName = req.ShortName.Trim() };
        db.Units.Add(unit);
        await db.SaveChangesAsync(ct);
        return new UnitDto(unit.Id, unit.Name, unit.ShortName);
    }
}

[ApiController, Route("api/stores"), Tags("Справочники")]
public class StoresController(StockDbContext db) : ControllerBase
{
    [HttpGet]
    public Task<List<StoreDto>> List(CancellationToken ct) =>
        db.Stores.Where(s => !s.IsDeleted).OrderBy(s => s.Name)
            .Select(s => new StoreDto(s.Id, s.Name)).ToListAsync(ct);

    [HttpPost]
    public async Task<StoreDto> Create(CreateStoreRequest req, CancellationToken ct)
    {
        var store = new Store { Id = Guid.NewGuid(), Name = req.Name.Trim() };
        db.Stores.Add(store);
        await db.SaveChangesAsync(ct);
        return new StoreDto(store.Id, store.Name);
    }
}

[ApiController, Route("api/suppliers"), Tags("Справочники")]
public class SuppliersController(StockDbContext db) : ControllerBase
{
    [HttpGet]
    public Task<List<SupplierDto>> List(CancellationToken ct) =>
        db.Suppliers.Where(s => !s.IsDeleted).OrderBy(s => s.Name)
            .Select(s => new SupplierDto(s.Id, s.Name, s.Inn, s.Phone)).ToListAsync(ct);

    [HttpPost]
    public async Task<SupplierDto> Create(CreateSupplierRequest req, CancellationToken ct)
    {
        var s = new Supplier { Id = Guid.NewGuid(), Name = req.Name.Trim(), Inn = req.Inn, Phone = req.Phone };
        db.Suppliers.Add(s);
        await db.SaveChangesAsync(ct);
        return new SupplierDto(s.Id, s.Name, s.Inn, s.Phone);
    }
}

[ApiController, Route("api/product-groups"), Tags("Справочники")]
public class ProductGroupsController(StockDbContext db) : ControllerBase
{
    [HttpGet]
    public Task<List<ProductGroupDto>> List(CancellationToken ct) =>
        db.ProductGroups.Where(g => !g.IsDeleted).OrderBy(g => g.Name)
            .Select(g => new ProductGroupDto(g.Id, g.ParentId, g.Name)).ToListAsync(ct);

    [HttpPost]
    public async Task<ProductGroupDto> Create(CreateProductGroupRequest req, CancellationToken ct)
    {
        var g = new ProductGroup { Id = Guid.NewGuid(), Name = req.Name.Trim(), ParentId = req.ParentId };
        db.ProductGroups.Add(g);
        await db.SaveChangesAsync(ct);
        return new ProductGroupDto(g.Id, g.ParentId, g.Name);
    }
}

[ApiController, Route("api/products"), Tags("Номенклатура и техкарты")]
public class ProductsController(StockDbContext db) : ControllerBase
{
    [HttpGet]
    public Task<List<ProductDto>> List([FromQuery] ProductType? type, CancellationToken ct) =>
        db.Products.Where(p => !p.IsDeleted && (type == null || p.Type == type))
            .OrderBy(p => p.Name)
            .Select(p => new ProductDto(p.Id, p.Article, p.Name, p.Type, p.UnitId, p.Unit.ShortName,
                p.WriteoffMethod, p.SalePrice, p.GroupId))
            .ToListAsync(ct);

    [HttpGet("{id:guid}")]
    public async Task<ProductDto> Get(Guid id, CancellationToken ct) =>
        await db.Products.Where(p => p.Id == id)
            .Select(p => new ProductDto(p.Id, p.Article, p.Name, p.Type, p.UnitId, p.Unit.ShortName,
                p.WriteoffMethod, p.SalePrice, p.GroupId))
            .FirstOrDefaultAsync(ct)
        ?? throw DomainException.NotFound("Товар");

    [HttpPost]
    public async Task<ProductDto> Create(CreateProductRequest req, CancellationToken ct)
    {
        var unit = await db.Units.FindAsync([req.UnitId], ct) ?? throw DomainException.NotFound("Единица измерения");

        var article = req.Article;
        if (string.IsNullOrWhiteSpace(article))
        {
            // Автоартикул как в iiko: следующий номер, 5 цифр
            var existing = await db.Products.Select(p => p.Article).ToListAsync(ct);
            var max = existing.Select(a => int.TryParse(a, out var n) ? n : 0).DefaultIfEmpty(0).Max();
            article = (max + 1).ToString("D5");
        }
        else if (await db.Products.AnyAsync(p => p.Article == article, ct))
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
        return new ProductDto(product.Id, product.Article, product.Name, product.Type, product.UnitId,
            unit.ShortName, product.WriteoffMethod, product.SalePrice, product.GroupId);
    }

    // ---------------- Техкарты ----------------

    [HttpGet("{productId:guid}/recipes")]
    public async Task<List<RecipeDto>> Recipes(Guid productId, CancellationToken ct)
    {
        var recipes = await db.Recipes
            .Include(r => r.Items).ThenInclude(i => i.Ingredient).ThenInclude(p => p.Unit)
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.DateFrom)
            .ToListAsync(ct);
        return recipes.Select(ToDto).ToList();
    }

    // Новая версия техкарты. Предыдущая открытая версия закрывается днём раньше —
    // так же, как iiko закрыл старую техкарту 12.10, когда ты завёл новую с 13.10.
    [HttpPost("{productId:guid}/recipes")]
    public async Task<RecipeDto> CreateRecipe(Guid productId, CreateRecipeRequest req, CancellationToken ct)
    {
        var product = await db.Products.FindAsync([productId], ct) ?? throw DomainException.NotFound("Блюдо");
        if (product.Type is not (ProductType.Dish or ProductType.Prepared))
            throw new DomainException("Техкарта бывает только у блюда или заготовки");
        if (req.Items.Count == 0)
            throw new DomainException("В техкарте нет ни одного ингредиента");
        if (req.Portions <= 0)
            throw new DomainException("Норма закладки должна быть больше нуля");

        var settings = await db.AccountingSettings.SingleAsync(ct);
        PostingService.EnsurePeriodOpen(settings, req.DateFrom);

        var ingredientIds = req.Items.Select(i => i.IngredientId).Distinct().ToList();
        if (ingredientIds.Contains(productId))
            throw new DomainException("Блюдо не может быть ингредиентом самого себя");
        var found = await db.Products.CountAsync(p => ingredientIds.Contains(p.Id), ct);
        if (found != ingredientIds.Count)
            throw DomainException.NotFound("Один из ингредиентов");

        var current = await db.Recipes
            .Where(r => r.ProductId == productId && r.DateTo == null)
            .FirstOrDefaultAsync(ct);
        if (current is not null)
        {
            if (current.DateFrom >= req.DateFrom)
                throw DomainException.Conflict(
                    $"Действующая версия начинается {current.DateFrom:dd.MM.yyyy}, новая должна начинаться позже");
            current.DateTo = req.DateFrom.AddDays(-1);
        }

        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            DateFrom = req.DateFrom,
            Portions = req.Portions,
            CreatedAt = DateTime.UtcNow,
            Items = req.Items.Select((i, idx) => new RecipeItem
            {
                Id = Guid.NewGuid(),
                LineNo = idx + 1,
                IngredientId = i.IngredientId,
                Gross = i.Gross,
                ColdLossPct = i.ColdLossPct,
                HotLossPct = i.HotLossPct
            }).ToList()
        };
        if (recipe.Items.Any(i => i.Gross <= 0))
            throw new DomainException("Брутто ингредиента должно быть больше нуля");

        db.Recipes.Add(recipe);
        await db.SaveChangesAsync(ct);

        return (await Recipes(productId, ct)).First(r => r.Id == recipe.Id);
    }

    private static RecipeDto ToDto(Recipe r) => new(
        r.Id, r.ProductId, r.DateFrom, r.DateTo, r.Portions,
        r.Items.OrderBy(i => i.LineNo).Select(i => new RecipeItemDto(
            i.LineNo, i.IngredientId, i.Ingredient.Name, i.Ingredient.Unit.ShortName,
            i.Gross, i.ColdLossPct, i.HotLossPct, Math.Round(i.Net, 6))).ToList());
}

[ApiController, Route("api/settings"), Tags("Настройки учёта")]
public class SettingsController(StockDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<SettingsDto> Get(CancellationToken ct)
    {
        var s = await db.AccountingSettings.SingleAsync(ct);
        return new SettingsDto(s.PeriodClosedUntil, s.AllowNegativeSales, s.AllowNegativeOther, s.BusinessDayStart);
    }

    [HttpPut]
    public async Task<SettingsDto> Update(SettingsDto req, CancellationToken ct)
    {
        var s = await db.AccountingSettings.SingleAsync(ct);
        s.PeriodClosedUntil = req.PeriodClosedUntil;
        s.AllowNegativeSales = req.AllowNegativeSales;
        s.AllowNegativeOther = req.AllowNegativeOther;
        s.BusinessDayStart = req.BusinessDayStart;
        await db.SaveChangesAsync(ct);
        return req;
    }
}