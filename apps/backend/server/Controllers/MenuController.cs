using Microsoft.AspNetCore.Mvc;
using server.Dtos;
using server.DTOS;
using server.Repositories;

namespace server.Controllers;

[ApiController]
[Route("api/v1/venues/{venueId:guid}/menu")]
public class MenuController : ControllerBase
{
    private readonly IMenuRepository _menuRepository;

    public MenuController(IMenuRepository menuRepository)
    {
        _menuRepository = menuRepository;
    }

    [HttpGet]
    public async Task<ActionResult<MenuSnapshotDto>> GetMenu(Guid venueId)
    {
        var menu = await _menuRepository.GetMenuByVenueAsync(venueId);

        if (menu is null)
        {
            return NotFound(new { message = $"Venue with ID '{venueId}' was not found." });
        }

        return Ok(menu);
    }
}