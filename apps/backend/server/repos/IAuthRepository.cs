using server.Dtos;

namespace server.Repositories;

public interface IAuthRepository
{
    Task<StaffDto?> GetStaffByPinHashAsync(string pinHash);
    Task<SessionResponseDto?> GetSessionContextAsync(Guid staffId, Guid terminalId, List<string> availableRoutes);
    Task LogAuditAsync(Guid venueId, string permission, string? subject, Guid? entityId, Guid actorId, Guid? approvedBy, Guid terminalId);
    List<string> GetPermissionsForRole(string role);
}