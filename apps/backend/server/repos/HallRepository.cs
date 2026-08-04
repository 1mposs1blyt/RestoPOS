using Dapper;
using Npgsql;
using server.Dtos;
using server.DTOS;
using server.repos;
using System.Data;

namespace server.Repositories;

public class HallRepository : IHallRepository
{
    private readonly string _connectionString;

    public HallRepository(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    private IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<IEnumerable<TableDto>> GetTablesByVenueAsync(Guid venueId)
    {
        using var db = CreateConnection();
        const string sql = @"
            SELECT 
                id AS Id, 
                venue_id AS VenueId, 
                label AS Label, 
                seats AS Capacity, 
                cx AS Cx, 
                cy AS Cy, 
                width AS Width, 
                height AS Height, 
                shape AS Shape
            FROM tables
            WHERE venue_id = @VenueId AND deleted = FALSE
            ORDER BY label ASC;";

        return await db.QueryAsync<TableDto>(sql, new { VenueId = venueId });
    }

    public async Task<IEnumerable<ActiveOrderSummaryDto>> GetActiveOrdersByVenueAsync(Guid venueId, string? status = null)
    {
        using var db = CreateConnection();
        const string sql = @"
        SELECT 
            o.id AS Id,
            o.table_id AS TableId,
            o.guest_count AS GuestCount,
            0.00::decimal AS TotalAmount,
            o.status AS Status,
            o.created_at AS CreatedAt
        FROM orders o
        WHERE o.venue_id = @VenueId
          AND (@Status::text IS NULL OR o.status = @Status)";

        return await db.QueryAsync<ActiveOrderSummaryDto>(sql, new { VenueId = venueId, Status = status });
    }

    public async Task<bool> UpdateTableLayoutAsync(Guid tableId, Guid venueId, UpdateTableLayoutRequest request)
    {
        using var db = CreateConnection();
        const string sql = @"
        UPDATE tables
        SET 
            cx = @Cx,
            cy = @Cy,
            width = @Width,
            height = @Height,
            revision = revision + 1
        WHERE id = @TableId AND venue_id = @VenueId AND deleted = FALSE;";

        var affectedRows = await db.ExecuteAsync(sql, new
        {
            TableId = tableId,
            VenueId = venueId,
            request.Cx,
            request.Cy,
            request.Width,
            request.Height
        });

        return affectedRows > 0;
    }
}