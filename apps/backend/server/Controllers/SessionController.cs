using Microsoft.AspNetCore.Mvc;
using server.Repositories;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("session")]
public class SessionController : ControllerBase
{
    private readonly IAuthRepository _authRepo;
    private readonly IRoutesService _routesService;

    public SessionController(IAuthRepository authRepo, IRoutesService routesService)
    {
        _authRepo = authRepo;
        _routesService = routesService;
    }

    [HttpGet]
    [HttpGet("bootstrap")]
    public async Task<IActionResult> GetSession([FromHeader(Name = "X-Terminal-Id")] Guid terminalId)
    {
        // Заглушка текущего авторизованного пользователя
        var currentStaffId = Guid.Parse("00000000-0000-0000-0000-000000000001");

        // Вычисляем права и доступные роуты
        var permissions = _authRepo.GetPermissionsForRole("manager");
        var availableRoutes = _routesService.GetAvailableRoutes(permissions, "pos");

        var session = await _authRepo.GetSessionContextAsync(currentStaffId, terminalId, availableRoutes);
        if (session == null)
            return StatusCode(403, new { error = "staff_not_bound", message = "Сотрудник не привязан к заведению" });

        return Ok(session);
    }
}