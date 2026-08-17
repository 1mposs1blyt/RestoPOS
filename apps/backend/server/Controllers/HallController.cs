using Microsoft.AspNetCore.Mvc;
using server.Dtos;
using server.DTOS;
using server.repos;
using server.Repositories;

namespace server.Controllers;

[ApiController]
[Route("api/v1/venues/{venueId:guid}")]
public class HallController : ControllerBase
{
    private readonly IHallRepository _hallRepository;

    public HallController(IHallRepository hallRepository)
    {
        _hallRepository = hallRepository;
    }

    [HttpGet("tables")]
    public async Task<ActionResult<IEnumerable<TableDto>>> GetTables(Guid venueId)
    {
        var tables = await _hallRepository.GetTablesByVenueAsync(venueId);
        return Ok(tables);
    }

    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<ActiveOrderSummaryDto>>> GetActiveOrders(Guid venueId, [FromQuery] string? status)
    {
        var orders = await _hallRepository.GetActiveOrdersByVenueAsync(venueId, status);
        return Ok(orders);
    }

    [HttpPut("tables/{id:guid}")]
    public async Task<IActionResult> UpdateTableLayout(Guid venueId, Guid id, [FromBody] UpdateTableLayoutRequest request)
    {
        // TODO: Добавить проверку права hall.layout.edit из контекста/токена
        var updated = await _hallRepository.UpdateTableLayoutAsync(id, venueId, request);

        if (!updated)
            return NotFound(new { message = "Table not found or not belonging to this venue" });

        return NoContent();
    }
}