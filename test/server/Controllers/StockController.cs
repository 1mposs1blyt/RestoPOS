using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;
using StockApi.Services;

namespace StockApi.Controllers;

[ApiController, Route("api/stock"), Tags("Остатки и движения")]
public class StockController(StockDbContext db) : ControllerBase
{
    /// <summary>Текущие остатки</summary>
    /// <remarks>storeId — только по одному складу. avgCost — средняя себестоимость единицы.</remarks>
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

    /// <summary>Остатки на момент времени</summary>
    /// <remarks>Считаются суммой всех движений до указанного момента включительно.</remarks>
    [HttpGet("balances/at")]
    public async Task<List<BalanceDto>> BalancesAt([FromQuery] DateTimeOffset at, [FromQuery] Guid? storeId, CancellationToken ct)
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

    /// <summary>История движений (карточка товара)</summary>
    /// <remarks>Без фильтров — все движения. Обычно указывают productId.</remarks>
    [HttpGet("movements")]
    public Task<List<MovementDto>> Movements([FromQuery] Guid? productId, [FromQuery] Guid? storeId, CancellationToken ct) =>
        Queries.Movements(db, m => (productId == null || m.ProductId == productId) && (storeId == null || m.StoreId == storeId))
            .ToListAsync(ct);

    /// <summary>Сверка остатков с движениями</summary>
    /// <remarks>Пустой список — всё сходится. Если что-то вернулось — баг в проведении.</remarks>
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
}
