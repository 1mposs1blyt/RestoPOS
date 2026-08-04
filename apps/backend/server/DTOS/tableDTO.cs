namespace server.DTOS
{

    // Информация о столе для холста
    public record TableDto(
        Guid Id,
        Guid VenueId,
        string Label,
        int Capacity,
        decimal Cx,
        decimal Cy,
        int Width,
        int Height,
        string Shape
    );

    // Сводка по активному заказу для вычисления статуса
    //public record ActiveOrderSummaryDto(
    //    Guid Id,
    //    Guid TableId,
    //    int GuestCount,
    //    decimal TotalAmount,
    //    string Status,
    //    DateTime CreatedAt
    //);
    public record ActiveOrderSummaryDto
    {
        public Guid Id { get; init; }
        public Guid TableId { get; init; }
        public int GuestCount { get; init; }
        public decimal TotalAmount { get; init; }
        public string Status { get; init; } = string.Empty;
        public DateTime CreatedAt { get; init; }

        // Конструктор по умолчанию для Dapper
        public ActiveOrderSummaryDto() { }
    }

    // Запрос на обновление позиционирования/размеров стола в конструкторе
    public record UpdateTableLayoutRequest(
        decimal Cx,
        decimal Cy,
        int Width,
        int Height
    );
}
