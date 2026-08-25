/*
 * СГЕНЕРИРОВАННЫЙ ФАЙЛ — не редактировать.
 * Источник: contracts/contract.json, генератор: scripts/build-contract.mjs.
 * Пересобрать: pnpm contracts:build
 *
 * Матрица прав у узла и у терминала обязана быть одной и той же. Рукописная
 * копия здесь разъезжается с фронтом на первой же правке контракта, и заметно
 * это становится по симптому вида «у менеджера пропал конструктор зала».
 */

// Файл с именем *.generated.cs компилятор считает автогенерируемым и выключает
// в нём контекст nullable, несмотря на <Nullable>enable</Nullable> в csproj:
// без этой строки `PlanQuota?` молча теряет смысл, а сборка узла даёт CS8669.
#nullable enable

namespace server;

public static class Contract
{
    public const int Version = 1;

    /** Шаблон имени комнаты realtime. Должен совпадать байт-в-байт с терминалом. */
    public const string RoomPattern = "venue:{venueId}:{terminalKind}";

    public static readonly IReadOnlyList<string> Roles = new[]
    {
        "waiter",
        "cashier",
        "manager",
        "cook",
        "support",
    };

    public static readonly IReadOnlyList<string> Permissions = new[]
    {
        "order.view",
        "order.create",
        "order.item.add",
        "order.send",
        "order.item.serve",
        "order.item.void",
        "order.discount",
        "order.cancel",
        "order.foreign",
        "order.item.split",
        "payment.accept",
        "payment.refund",
        "cash.drawer",
        "cash.deposit",
        "cash.withdraw",
        "cashier.change",
        "shift.open",
        "shift.close",
        "report.x",
        "report.z",
        "report.view",
        "audit.view",
        "kitchen.view",
        "kitchen.item.status",
        "print.reprint",
        "station.manage",
        "hall.layout.edit",
        "menu.stoplist",
        "menu.edit",
        "staff.manage",
        "staff.attendance",
        "staff.self",
        "guest.manage",
        "delivery.view",
        "delivery.manage",
        "document.view",
        "document.create",
        "warehouse.view",
        "warehouse.edit",
        "terminal.service",
    };

    public static readonly IReadOnlyList<string> ErrorCodes = new[]
    {
        "invalid_pin",
        "staff_not_in_venue",
        "no_screens_for_role",
        "permission_denied",
        "override_required",
        "override_invalid",
        "feature_not_available",
        "quota_exceeded",
        "shift_not_open",
        "order_not_editable",
        "cash_shift_not_open",
        "cash_shift_already_open",
        "cash_insufficient",
        "staff_shift_not_open",
    };

    public static readonly IReadOnlyList<string> EventTopics = new[]
    {
        "order.created",
        "order.updated",
        "order_item.status_changed",
        "table.status_changed",
        "print_job.failed",
        "stoplist.changed",
        "cash_shift.opened",
        "cash_shift.closed",
        "cash_operation.created",
        "staff_shift.changed",
        "delivery.status_changed",
        "audit.recorded",
    };

    /// <summary>Права, которые можно получить разово — подтверждением сотрудника, у которого они есть по роли.</summary>
    public static readonly IReadOnlySet<string> Overridable = new HashSet<string>
    {
        "order.item.void",
        "order.discount",
        "order.cancel",
        "order.foreign",
        "payment.refund",
    };

    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> RolePermissions =
        new Dictionary<string, IReadOnlyList<string>>
    {
        ["waiter"] = new[]
        {
            "order.view",
            "order.create",
            "order.item.add",
            "order.send",
            "order.item.serve",
            "order.item.split",
            "payment.accept",
            "guest.manage",
            "delivery.view",
            "staff.self",
        },
        ["cashier"] = new[]
        {
            "order.view",
            "order.create",
            "order.item.add",
            "order.send",
            "order.item.serve",
            "order.item.split",
            "order.cancel",
            "order.foreign",
            "payment.accept",
            "payment.refund",
            "cash.drawer",
            "cash.deposit",
            "cash.withdraw",
            "cashier.change",
            "shift.open",
            "shift.close",
            "report.x",
            "report.view",
            "kitchen.item.status",
            "print.reprint",
            "menu.stoplist",
            "guest.manage",
            "delivery.view",
            "delivery.manage",
            "document.view",
            "staff.self",
        },
        ["manager"] = new[]
        {
            "order.view",
            "order.create",
            "order.item.add",
            "order.send",
            "order.item.serve",
            "order.item.void",
            "order.item.split",
            "order.discount",
            "order.cancel",
            "order.foreign",
            "payment.accept",
            "payment.refund",
            "cash.drawer",
            "cash.deposit",
            "cash.withdraw",
            "cashier.change",
            "shift.open",
            "shift.close",
            "report.x",
            "report.z",
            "report.view",
            "audit.view",
            "kitchen.view",
            "kitchen.item.status",
            "print.reprint",
            "hall.layout.edit",
            "menu.stoplist",
            "menu.edit",
            "staff.manage",
            "staff.attendance",
            "guest.manage",
            "delivery.view",
            "delivery.manage",
            "document.view",
            "document.create",
            "warehouse.view",
            "warehouse.edit",
            "staff.self",
        },
        ["cook"] = new[]
        {
            "kitchen.view",
            "kitchen.item.status",
            "print.reprint",
            "menu.stoplist",
            "staff.self",
        },
        ["support"] = new[]
        {
            "terminal.service",
            "station.manage",
        },
    };

    /// <summary>Права роли. Неизвестная роль — пустой набор, а не исключение: отказ решает вызывающий.</summary>
    public static IReadOnlyList<string> PermissionsOf(string role) =>
        RolePermissions.TryGetValue(role, out var permissions) ? permissions : Array.Empty<string>();

    public static bool HasPermission(string role, string permission) =>
        PermissionsOf(role).Contains(permission);

    /// <summary>
    /// Может ли обладатель роли подтвердить чужое действие. Подтверждает тот,
    /// у кого право есть по роли, — не обязательно менеджер: возврат и чужой
    /// заказ кассир подтверждает сам.
    /// </summary>
    public static bool CanApprove(string role, string permission) =>
        Overridable.Contains(permission) && HasPermission(role, permission);

    /// <summary>Тарифы от дешёвого к дорогому: порядок значим, лестница обязана расти.</summary>
    public static readonly IReadOnlyList<string> PlanCodes = new[]
    {
        "start",
        "standard",
        "pro",
    };

    public static readonly IReadOnlyList<string> FeatureCodes = new[]
    {
        "warehouse",
        "kds",
        "delivery",
        "reports",
        "egais",
        "loyalty",
        "analytics",
        "suppliers",
        "multi_venue",
    };

    /// <summary>
    /// Булевы модули тарифа. Числовые ограничения сюда не входят намеренно
    /// (инвариант №2): они живут в PlanQuotas и проверяются счётом текущего
    /// использования, а не наличием флага.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> PlanFeatures =
        new Dictionary<string, IReadOnlyList<string>>
    {
        ["start"] = Array.Empty<string>(),
        ["standard"] = new[]
        {
            "warehouse",
            "kds",
            "delivery",
            "reports",
        },
        ["pro"] = new[]
        {
            "warehouse",
            "kds",
            "delivery",
            "reports",
            "egais",
            "loyalty",
            "analytics",
            "suppliers",
            "multi_venue",
        },
    };

    /// <summary>Числовые лимиты тарифа: проверяются счётом использования, а не флагом.</summary>
    public sealed record PlanQuota(int MaxTerminals, int MaxVenues, int MaxStaff);

    public static readonly IReadOnlyDictionary<string, PlanQuota> PlanQuotas =
        new Dictionary<string, PlanQuota>
    {
        ["start"] = new PlanQuota(2, 1, 3),
        ["standard"] = new PlanQuota(5, 3, 25),
        ["pro"] = new PlanQuota(50, 50, 1000),
    };

    /// <summary>Входит ли модуль в тариф. Неизвестный тариф — не входит: отказ решает вызывающий.</summary>
    public static bool PlanHasFeature(string plan, string feature) =>
        PlanFeatures.TryGetValue(plan, out var features) && features.Contains(feature);

    /// <summary>Лимиты тарифа. Неизвестный тариф — null, а не исключение: как и у PermissionsOf.</summary>
    public static PlanQuota? QuotasOf(string plan) =>
        PlanQuotas.TryGetValue(plan, out var quotas) ? quotas : null;
}
