using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;

namespace StockApi.Controllers;

[ApiController, Route("api/units"), Tags("Справочники: единицы измерения")]
public class UnitsController(StockDbContext db) : ControllerBase
{
    /// <summary>Список единиц измерения</summary>
    [HttpGet]
    public Task<List<UnitDto>> List(CancellationToken ct) =>
        db.Units.OrderBy(u => u.Name).Select(u => new UnitDto(u.Id, u.Name, u.ShortName)).ToListAsync(ct);

    /// <summary>Добавить единицу измерения</summary>
    [HttpPost]
    public async Task<UnitDto> Create(CreateUnitRequest req, CancellationToken ct)
    {
        var unit = new Unit { Id = Guid.NewGuid(), Name = req.Name.Trim(), ShortName = req.ShortName.Trim() };
        db.Units.Add(unit);
        await db.SaveChangesAsync(ct);
        return new UnitDto(unit.Id, unit.Name, unit.ShortName);
    }
}
