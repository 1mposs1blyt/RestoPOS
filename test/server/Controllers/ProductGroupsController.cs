using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;

namespace StockApi.Controllers;

[ApiController, Route("api/product-groups"), Tags("Справочники: группы номенклатуры")]
public class ProductGroupsController(StockDbContext db) : ControllerBase
{
    /// <summary>Список групп (папок) номенклатуры</summary>
    [HttpGet]
    public Task<List<ProductGroupDto>> List(CancellationToken ct) =>
        db.ProductGroups.Where(g => !g.IsDeleted).OrderBy(g => g.Name)
            .Select(g => new ProductGroupDto(g.Id, g.ParentId, g.Name)).ToListAsync(ct);

    /// <summary>Добавить группу</summary>
    /// <remarks>parentId — родительская группа, если нужна вложенность.</remarks>
    [HttpPost]
    public async Task<ProductGroupDto> Create(CreateProductGroupRequest req, CancellationToken ct)
    {
        var g = new ProductGroup { Id = Guid.NewGuid(), Name = req.Name.Trim(), ParentId = req.ParentId };
        db.ProductGroups.Add(g);
        await db.SaveChangesAsync(ct);
        return new ProductGroupDto(g.Id, g.ParentId, g.Name);
    }
}
