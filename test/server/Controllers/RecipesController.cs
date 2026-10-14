using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;
using StockApi.Services;

namespace StockApi.Controllers;

[ApiController, Route("api/products/{productId:guid}/recipes"), Tags("Техкарты")]
public class RecipesController(StockDbContext db) : ControllerBase
{
    /// <summary>Все версии техкарты блюда, новые сверху</summary>
    [HttpGet]
    public async Task<List<RecipeDto>> List(Guid productId, CancellationToken ct)
    {
        var recipes = await db.Recipes
            .Include(r => r.Items).ThenInclude(i => i.Ingredient).ThenInclude(p => p.Unit)
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.DateFrom)
            .ToListAsync(ct);
        return recipes.Select(r => r.ToDto()).ToList();
    }

    /// <summary>Создать новую версию техкарты</summary>
    /// <remarks>
    /// Действующая версия автоматически закроется днём раньше dateFrom.
    /// gross — брутто на portions порций (по умолчанию на 1 порцию).
    /// </remarks>
    [HttpPost]
    public async Task<RecipeDto> Create(Guid productId, CreateRecipeRequest req, CancellationToken ct)
    {
        var product = await db.Products.FindAsync([productId], ct) ?? throw DomainException.NotFound("Блюдо");
        if (product.Type is not (ProductType.Dish or ProductType.Prepared))
            throw new DomainException("Техкарта бывает только у блюда или заготовки");
        if (req.Items.Count == 0)
            throw new DomainException("В техкарте нет ни одного ингредиента");
        if (req.Portions <= 0)
            throw new DomainException("Норма закладки должна быть больше нуля");
        if (req.Items.Any(i => i.Gross <= 0))
            throw new DomainException("Брутто ингредиента должно быть больше нуля");

        var settings = await db.AccountingSettings.SingleAsync(ct);
        PostingService.EnsurePeriodOpen(settings, req.DateFrom);

        var ingredientIds = req.Items.Select(i => i.IngredientId).Distinct().ToList();
        if (ingredientIds.Contains(productId))
            throw new DomainException("Блюдо не может быть ингредиентом самого себя");
        if (await db.Products.CountAsync(p => ingredientIds.Contains(p.Id), ct) != ingredientIds.Count)
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

        db.Recipes.Add(recipe);
        await db.SaveChangesAsync(ct);

        return (await List(productId, ct)).First(r => r.Id == recipe.Id);
    }
}
