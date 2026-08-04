using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using server.Dtos;
using server.Repositories;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthRepository _authRepo;
    private readonly IRoutesService _routesService;

    public AuthController(IAuthRepository authRepo, IRoutesService routesService)
    {
        _authRepo = authRepo;
        _routesService = routesService;
    }

    private static string HashPin(string pin) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(pin)));

    [HttpPost("pin")]
    public async Task<IActionResult> PinAuth([FromBody] PinAuthRequest request, [FromHeader(Name = "X-Terminal-Id")] Guid terminalId)
    {
        var pinHash = HashPin(request.Pin);
        var staff = await _authRepo.GetStaffByPinHashAsync(pinHash);

        if (staff == null)
            return Unauthorized(new { error = "invalid_pin", message = "Неверный PIN-код" });

        var permissions = _authRepo.GetPermissionsForRole(staff.Role);

        // Получаем предварительно тип терминала (mock для логики, берется в GetSessionContext)
        // Если у пользователя нет работы на этом терминале:
        var availableRoutes = _routesService.GetAvailableRoutes(permissions, "pos"); // Значение терминала берется из БД

        if (!_routesService.HasWorkOn(permissions, "pos"))
        {
            return StatusCode(403, new { error = "no_terminal_access", message = "У вашей роли нет доступа к функциям этого терминала" });
        }

        var session = await _authRepo.GetSessionContextAsync(staff.Id, terminalId, availableRoutes);
        if (session == null)
            return StatusCode(403, new { error = "staff_not_bound", message = "Сотрудник не привязан к данному заведению" });

        return Ok(session);
    }

    [HttpPost("override")]
    public async Task<IActionResult> OverrideAuth([FromBody] OverrideAuthRequest request, [FromHeader(Name = "X-Terminal-Id")] Guid terminalId, [FromHeader(Name = "X-Venue-Id")] Guid venueId)
    {
        var pinHash = HashPin(request.Pin);
        var approver = await _authRepo.GetStaffByPinHashAsync(pinHash);

        if (approver == null)
            return Unauthorized(new { error = "invalid_pin", message = "Неверный PIN-код подтверждающего" });

        if (approver.Role != "manager")
            return StatusCode(403, new { error = "insufficient_permissions", message = "Недостаточно прав для подтверждения действия" });

        // В реальном запросе actorId вытаскивается из Auth Context сессии кассира
        var actorId = approver.Id;

        await _authRepo.LogAuditAsync(venueId, request.Permission, $"Override action: {request.Permission}", request.EntityId, actorId, approver.Id, terminalId);

        return Ok(new OverrideResponseDto($"temp_token_{Guid.NewGuid():N}", 60));
    }
}