namespace server.DTOS
{
    public record MenuCategoryDto(
    string Id,
    Guid VenueId,
    string Name,
    int SortOrder
);

    public record MenuItemDto(
        string Id,
        string CategoryId,
        string Name,
        string Price, // Важно: строка "420.00" по контракту ККТ/фронта
        bool IsStopListed,
        string? PrepStationId
    );

    public record MenuSnapshotDto(
        List<MenuCategoryDto> Categories,
        List<MenuItemDto> Items
    );
}
