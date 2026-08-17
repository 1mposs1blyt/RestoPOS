namespace server.Services;

public record RouteSpec(string Route, string Screen, string Permission, string[] Terminals, bool IsAuxiliary);

public interface IRoutesService
{
    List<string> GetAvailableRoutes(List<string> permissions, string terminalKind);
    bool HasWorkOn(List<string> permissions, string terminalKind);
}

public class RoutesService : IRoutesService
{
    private static readonly List<RouteSpec> Specs = new()
    {
        new("menu", "mainmenuscreen", "staff.self", ["pos", "kds", "admin"], IsAuxiliary: true),
        new("hall", "tablescheme", "order.view", ["pos", "admin"], IsAuxiliary: false),
        new("order", "orderscreen", "order.view", ["pos", "admin"], IsAuxiliary: true),
        new("counter", "counterscreen", "order.view", ["pos", "admin"], IsAuxiliary: false),
        new("payment", "paymentscreen", "payment.accept", ["pos", "admin"], IsAuxiliary: true),
        new("cash", "cashscreen", "cash.drawer", ["pos", "admin"], IsAuxiliary: false),
        new("kitchen", "kitchenscreen", "kitchen.view", ["kds", "admin"], IsAuxiliary: false),
        new("stations", "stationsscreen", "station.manage", ["pos", "kds", "admin"], IsAuxiliary: false),
        new("personal", "personalscreen", "staff.self", ["pos", "kds", "admin"], IsAuxiliary: true),
        new("audit", "auditscreen", "audit.view", ["pos", "kds", "admin"], IsAuxiliary: true),
        new("attendance", "attendancescreen", "staff.attendance", ["pos", "kds", "admin"], IsAuxiliary: true),
        new("delivery", "deliveryscreen", "delivery.view", ["pos", "admin"], IsAuxiliary: false),
        new("reports", "reportsscreen", "report.view", ["pos", "admin"], IsAuxiliary: true),
        new("stoplist", "stoplistscreen", "menu.stoplist", ["pos", "kds", "admin"], IsAuxiliary: true),
        new("guests", "guestsscreen", "guest.manage", ["pos", "admin"], IsAuxiliary: true),
        new("documents", "documentsscreen", "document.view", ["pos", "admin"], IsAuxiliary: true),
        new("devices", "devicesscreen", "terminal.service", ["pos", "kds", "admin"], IsAuxiliary: true),
        // Сервисный экран — рабочий, а не сопутствующий: у роли `support` право
        // ровно одно, и пометка «сопутствующий» означала бы, что вендорского
        // инженера узел не пускает на терминал вовсе.
        new("service", "servicescreen", "terminal.service", ["pos", "kds", "admin"], IsAuxiliary: false),
    };

    public List<string> GetAvailableRoutes(List<string> permissions, string terminalKind)
    {
        return Specs
            .Where(s => s.Terminals.Contains(terminalKind) && permissions.Contains(s.Permission))
            .Select(s => s.Route)
            .ToList();
    }

    public bool HasWorkOn(List<string> permissions, string terminalKind)
    {
        return Specs.Any(s => !s.IsAuxiliary && s.Terminals.Contains(terminalKind) && permissions.Contains(s.Permission));
    }
}