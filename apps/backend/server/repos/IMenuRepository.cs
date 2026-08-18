
using server.DTOS;

namespace server.Repositories;

public interface IMenuRepository
{
    Task<MenuSnapshotDto?> GetMenuByVenueAsync(Guid venueId);
}