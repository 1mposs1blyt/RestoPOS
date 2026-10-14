using System.Linq.Expressions;
using StockApi.Data;

namespace StockApi.Services;

// Превращения сущностей в DTO, которые нужны в нескольких контроллерах
public static class Mappers
{
    public static DocumentDto ToDto(this Document d) => new(
        d.Id, d.Type, d.Number, d.DocDate, d.Status, d.StoreId, d.StoreToId, d.SupplierId,
        d.WriteoffReason, d.Comment, d.IsAutomatic, d.CreatedAt, d.PostedAt,
        d.Items.Sum(i => i.Amount ?? 0),
        d.Items.OrderBy(i => i.LineNo).Select(i => new DocumentItemDto(
            i.Id, i.LineNo, i.ProductId, i.Product.Name, i.Product.Unit.ShortName,
            i.Quantity, i.Price, i.Amount)).ToList());

    public static RecipeDto ToDto(this Recipe r) => new(
        r.Id, r.ProductId, r.DateFrom, r.DateTo, r.Portions,
        r.Items.OrderBy(i => i.LineNo).Select(i => new RecipeItemDto(
            i.LineNo, i.IngredientId, i.Ingredient.Name, i.Ingredient.Unit.ShortName,
            i.Gross, i.ColdLossPct, i.HotLossPct, Math.Round(i.Net, 6))).ToList());
}

// Запросы, которые переиспользуются в нескольких местах
public static class Queries
{
    public static IQueryable<ProductDto> ProductDtos(IQueryable<Product> products) =>
        products.Select(p => new ProductDto(p.Id, p.Article, p.Name, p.Type, p.UnitId, p.Unit.ShortName,
            p.WriteoffMethod, p.SalePrice, p.GroupId));

    // Фильтр применяется ДО проекции в DTO: после проекции в record EF фильтровать не умеет
    public static IQueryable<MovementDto> Movements(StockDbContext db, Expression<Func<StockMovement, bool>> filter) =>
        from m in db.StockMovements.Where(filter)
        join d in db.Documents on m.DocumentId equals d.Id
        join p in db.Products on m.ProductId equals p.Id
        orderby m.MovementDate, m.Id
        select new MovementDto(m.Id, m.MovementDate, d.Id, d.Type, d.Number,
            m.StoreId, m.ProductId, p.Name, m.Quantity, m.CostAmount);
}
