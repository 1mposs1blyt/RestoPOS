using System.Data;
using Dapper;
using Npgsql;
using server.Dtos;

namespace server.Repositories;



public class AuthRepository : IAuthRepository
{
    private readonly string _connectionString;

    public AuthRepository(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    private IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<StaffDto?> GetStaffByPinHashAsync(string pinHash)
    {
        using var db = CreateConnection();
        const string sql = @"
            SELECT id, full_name AS FullName, role 
            FROM staff 
            WHERE pin_code_hash = @PinHash AND deleted = FALSE;";

        return await db.QueryFirstOrDefaultAsync<StaffDto>(sql, new { PinHash = pinHash });
    }

    public async Task<SessionResponseDto?> GetSessionContextAsync(Guid staffId, Guid terminalId, List<string> availableRoutes)
    {
        using var db = CreateConnection();
        const string sql = @"
        -- 1. Данные сотрудника
        SELECT id, full_name AS FullName, role FROM staff WHERE id = @StaffId AND deleted = FALSE;

        -- 2. Данные контекста
        SELECT 
            t.id AS TerminalId, t.kind AS TerminalKind, t.label AS TerminalLabel, 
            v.id AS VenueId, v.name AS VenueName, v.service_mode AS VenueServiceMode, 
            p.code AS PlanCode, p.name AS PlanName 
        FROM terminals t
        JOIN venues v ON t.venue_id = v.id
        JOIN organizations o ON v.organization_id = o.id
        JOIN subscriptions sub ON sub.organization_id = o.id AND sub.status = 'active'
        JOIN plans p ON sub.plan_id = p.id
        WHERE t.id = @TerminalId AND t.deleted = FALSE AND v.deleted = FALSE;

        -- 3. Открытая кассовая смена заведения
        SELECT id, opened_at AS OpenedAt FROM cash_shifts 
        WHERE venue_id = (SELECT venue_id FROM terminals WHERE id = @TerminalId) 
          AND closed_at IS NULL 
        LIMIT 1;

        -- 4. Личная смена сотрудника (поopened_by вместо staff_id)
        SELECT id, opened_at AS ClockIn, closed_at AS ClockOut FROM shifts
        WHERE opened_by = @StaffId AND closed_at IS NULL
        LIMIT 1;
    ";

        using var multi = await db.QueryMultipleAsync(sql, new { StaffId = staffId, TerminalId = terminalId });

        var staff = await multi.ReadFirstOrDefaultAsync<StaffDto>();
        if (staff == null) return null;

        var ctxRow = await multi.ReadFirstOrDefaultAsync<ContextRowDto>();
        if (ctxRow == null) return null;

        var currentShift = await multi.ReadFirstOrDefaultAsync<ShiftDto>();
        var staffShift = await multi.ReadFirstOrDefaultAsync<StaffShiftDto>();

        var terminal = new TerminalDto(ctxRow.TerminalId, ctxRow.TerminalKind, ctxRow.TerminalLabel);
        var venue = new VenueDto(ctxRow.VenueId, ctxRow.VenueName, ctxRow.VenueServiceMode);
        var plan = new PlanDto(ctxRow.PlanCode, ctxRow.PlanName);

        var permissions = GetPermissionsForRole(staff.Role);

        return new SessionResponseDto(
            staff,
            permissions,
            venue,
            terminal,
            plan,
            currentShift,
            staffShift,
            availableRoutes
        );
    }

    public async Task LogAuditAsync(Guid venueId, string permission, string? subject, Guid? entityId, Guid actorId, Guid? approvedBy, Guid terminalId)
    {
        using var db = CreateConnection();
        const string sql = @"
            INSERT INTO audit_log (venue_id, permission, subject, entity_id, actor_id, approved_by, terminal_id)
            VALUES (@VenueId, @Permission, @Subject, @EntityId, @ActorId, @ApprovedBy, @TerminalId);";

        await db.ExecuteAsync(sql, new { VenueId = venueId, Permission = permission, Subject = subject, EntityId = entityId, ActorId = actorId, ApprovedBy = approvedBy, TerminalId = terminalId });
    }

    public List<string> GetPermissionsForRole(string role) => role switch
    {
        "manager" => ["staff.self", "order.view", "payment.accept", "cash.drawer", "kitchen.view", "station.manage", "audit.view", "staff.attendance", "delivery.view", "report.view", "menu.stoplist", "guest.manage", "document.view", "terminal.service"],
        "cook" => ["staff.self", "kitchen.view", "menu.stoplist", "staff.attendance"],
        "cashier" => ["staff.self", "order.view", "payment.accept", "cash.drawer", "staff.attendance"],
        _ => ["staff.self"]
    };

    private class ContextRowDto
    {
        public Guid TerminalId { get; set; }
        public string TerminalKind { get; set; } = string.Empty;
        public string TerminalLabel { get; set; } = string.Empty;
        public Guid VenueId { get; set; }
        public string VenueName { get; set; } = string.Empty;
        public string VenueServiceMode { get; set; } = string.Empty;
        public string PlanCode { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
    }
}