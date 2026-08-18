using Dapper;
using Npgsql;
using server.Dtos;
using server.DTOS;
using System.Data;

namespace server.Repositories;

public class MenuRepository : IMenuRepository
{
    private readonly string _connectionString;

    public MenuRepository(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    private IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<MenuSnapshotDto?> GetMenuByVenueAsync(Guid venueId)
    {
        using var db = CreateConnection();

        // Проверяем, существует ли заведение в принципе
        const string checkVenueSql = "SELECT EXISTS(SELECT 1 FROM venues WHERE id = @VenueId AND deleted = FALSE);";
        var venueExists = await db.ExecuteScalarAsync<bool>(checkVenueSql, new { VenueId = venueId });

        if (!venueExists)
        {
            return null;
        }

        const string sql = @"
        -- 1. Категории
        SELECT 
            id::text AS Id, 
            venue_id AS VenueId, 
            name AS Name, 
            sort_order AS SortOrder
        FROM menu_categories
        WHERE venue_id = @VenueId AND deleted = FALSE
        ORDER BY sort_order ASC;

        -- 2. Блюда/Позиции меню
        SELECT 
            mi.id::text AS Id, 
            mi.category_id::text AS CategoryId, 
            mi.name AS Name, 
            to_char(mi.price, 'FM9999990.00') AS Price,
            CASE 
                WHEN sl.remainder IS NOT NULL AND sl.remainder <= 0 THEN TRUE 
                ELSE FALSE 
            END AS IsStopListed, 
            mi.prep_station_id::text AS PrepStationId
        FROM menu_items mi
        INNER JOIN menu_categories mc ON mc.id = mi.category_id
        LEFT JOIN stop_list sl ON sl.menu_item_id = mi.id AND sl.venue_id = @VenueId
        WHERE mc.venue_id = @VenueId 
          AND mi.deleted = FALSE 
          AND mc.deleted = FALSE
        ORDER BY mi.name ASC;
    ";

        using var multi = await db.QueryMultipleAsync(sql, new { VenueId = venueId });

        var categories = (await multi.ReadAsync<MenuCategoryDto>()).ToList();
        var items = (await multi.ReadAsync<MenuItemDto>()).ToList();

        return new MenuSnapshotDto(categories, items);
    }
}