using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;

namespace StockApi.Controllers;

[ApiController, Route("api/stores"), Tags("Справочники: склады")]
public class StoresController(StockDbContext db) : ControllerBase
{
    /// <summary>Список складов</summary>
    [HttpGet]
    public Task<List<StoreDto>> List(CancellationToken ct) =>
        db.Stores.Where(s => !s.IsDeleted).OrderBy(s => s.Name)
            .Select(s => new StoreDto(s.Id, s.Name)).ToListAsync(ct);

    /// <summary>Добавить склад</summary>
    [HttpPost]
    public async Task<StoreDto> Create(CreateStoreRequest req, CancellationToken ct)
    {
        var store = new Store { Id = Guid.NewGuid(), Name = req.Name.Trim() };
        db.Stores.Add(store);
        await db.SaveChangesAsync(ct);
        return new StoreDto(store.Id, store.Name);
    }
}
