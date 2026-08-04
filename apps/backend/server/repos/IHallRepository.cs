using server.DTOS;

namespace server.repos
{
    public interface IHallRepository
    {
        Task<IEnumerable<TableDto>> GetTablesByVenueAsync(Guid venueId);
        Task<IEnumerable<ActiveOrderSummaryDto>> GetActiveOrdersByVenueAsync(Guid venueId, string? status = null);
        Task<bool> UpdateTableLayoutAsync(Guid tableId, Guid venueId, UpdateTableLayoutRequest request);
    }
}
