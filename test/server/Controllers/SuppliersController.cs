using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;

namespace StockApi.Controllers;

[ApiController, Route("api/suppliers"), Tags("Справочники: поставщики")]
public class SuppliersController(StockDbContext db) : ControllerBase
{
    /// <summary>Список поставщиков</summary>
    [HttpGet]
    public Task<List<SupplierDto>> List(CancellationToken ct) =>
        db.Suppliers.Where(s => !s.IsDeleted).OrderBy(s => s.Name)
            .Select(s => new SupplierDto(s.Id, s.Name, s.Inn, s.Phone)).ToListAsync(ct);

    /// <summary>Добавить поставщика</summary>
    [HttpPost]
    public async Task<SupplierDto> Create(CreateSupplierRequest req, CancellationToken ct)
    {
        var s = new Supplier { Id = Guid.NewGuid(), Name = req.Name.Trim(), Inn = req.Inn, Phone = req.Phone };
        db.Suppliers.Add(s);
        await db.SaveChangesAsync(ct);
        return new SupplierDto(s.Id, s.Name, s.Inn, s.Phone);
    }
}
