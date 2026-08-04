namespace server.Dtos;

// Запросы
public record PinAuthRequest(string Pin);
public record OverrideAuthRequest(string Pin, string Permission, Guid? EntityId);

// Ответы
public record SessionResponseDto(
    StaffDto Staff,
    List<string> Permissions,
    VenueDto Venue,
    TerminalDto Terminal,
    PlanDto Plan,
    ShiftDto? CurrentShift,          // cash_shifts
    StaffShiftDto? ActiveStaffShift, // staff_shifts
    List<string> AvailableRoutes     // Маршруты под terminal.kind + permissions
);

public record StaffDto(Guid Id, string FullName, string Role);
public record VenueDto(Guid Id, string Name, string ServiceMode);
public record TerminalDto(Guid Id, string Kind, string? Label);
public record PlanDto(string Code, string Name);
public record ShiftDto(Guid Id, DateTime OpenedAt);
public record StaffShiftDto(Guid Id, DateTime ClockIn);

public record OverrideResponseDto(string TemporaryToken, int ExpiresInSeconds = 60);


