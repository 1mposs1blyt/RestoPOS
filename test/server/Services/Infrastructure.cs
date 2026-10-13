using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace StockApi.Services;

// Ошибка бизнес-логики учёта: "период закрыт", "нет остатка" и т.п.
// Превращается в ответ 400/404/409 с понятным текстом.
public class DomainException(string message, int statusCode = StatusCodes.Status400BadRequest)
    : Exception(message)
{
    public int StatusCode { get; } = statusCode;

    public static DomainException NotFound(string what) =>
        new($"{what} не найден(а)", StatusCodes.Status404NotFound);

    public static DomainException Conflict(string message) =>
        new(message, StatusCodes.Status409Conflict);
}

public class DomainExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception ex, CancellationToken ct)
    {
        if (ex is not DomainException de) return false;

        http.Response.StatusCode = de.StatusCode;
        await http.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = de.StatusCode,
            Title = "Ошибка учёта",
            Detail = de.Message
        }, ct);
        return true;
    }
}

// Перевод UTC-времени документа в местную дату ресторана.
// От этой даты зависит, какая техкарта применится и не закрыт ли период.
public class BusinessClock(IConfiguration config)
{
    private readonly TimeZoneInfo _tz =
        TimeZoneInfo.FindSystemTimeZoneById(config["Accounting:TimeZone"] ?? "Europe/Moscow");

    public DateOnly LocalDate(DateTime utc) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), _tz));
}