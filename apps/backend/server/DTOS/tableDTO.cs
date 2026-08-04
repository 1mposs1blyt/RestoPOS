namespace server.DTOS
{
    public record TableDto(
    Guid Id,
    Guid VenueId,
    string Label,
    int Capacity,
    decimal Cx,
    decimal Cy,
    int Width,
    int Height,
    string Shape // "square", "circle", "rect"
);
}
