using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;
using StockApi.Services;

namespace StockApi.Controllers;

[ApiController, Route("api/documents/{id:guid}"), Tags("Документы: проведение")]
public class DocumentPostingController(StockDbContext db, PostingService posting) : ControllerBase
{
    /// <summary>Провести черновик</summary>
    /// <remarks>
    /// Создаёт движения по складу и меняет остатки. Продажи и списания блюд раскладываются
    /// по техкарте на дату документа. Если что-то не так (закрыт период, запрещён минус,
    /// есть документы позже) — ничего не меняется, документ остаётся черновиком.
    /// </remarks>
    [HttpPost("post")]
    public async Task<DocumentDto> Post(Guid id, CancellationToken ct)
    {
        await posting.PostAsync(id, ct);
        return await LoadAsync(id, ct);
    }

    /// <summary>Отменить проведение</summary>
    /// <remarks>Удаляет движения документа, возвращает остатки и делает документ снова черновиком.</remarks>
    [HttpPost("unpost")]
    public async Task<DocumentDto> Unpost(Guid id, CancellationToken ct)
    {
        await posting.UnpostAsync(id, ct);
        return await LoadAsync(id, ct);
    }

    /// <summary>Движения, которые создал документ</summary>
    /// <remarks>У черновика движений нет — пустой список.</remarks>
    [HttpGet("movements")]
    public Task<List<MovementDto>> Movements(Guid id, CancellationToken ct) =>
        Queries.Movements(db, m => m.DocumentId == id).ToListAsync(ct);

    private async Task<DocumentDto> LoadAsync(Guid id, CancellationToken ct) =>
        (await db.Documents
            .Include(x => x.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Unit)
            .FirstAsync(x => x.Id == id, ct)).ToDto();
}
