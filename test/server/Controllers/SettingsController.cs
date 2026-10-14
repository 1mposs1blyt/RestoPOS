using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;

namespace StockApi.Controllers;

[ApiController, Route("api/settings"), Tags("Настройки учёта")]
public class SettingsController(StockDbContext db) : ControllerBase
{
    /// <summary>Текущие настройки учёта</summary>
    [HttpGet]
    public async Task<SettingsDto> Get(CancellationToken ct)
    {
        var s = await db.AccountingSettings.SingleAsync(ct);
        return new SettingsDto(s.PeriodClosedUntil, s.AllowNegativeSales, s.AllowNegativeOther, s.BusinessDayStart);
    }

    /// <summary>Изменить настройки учёта</summary>
    /// <remarks>
    /// periodClosedUntil — по эту дату включительно документы менять нельзя (null — период открыт).
    /// allowNegativeSales — разрешать продажам уводить остаток в минус.
    /// allowNegativeOther — то же для списаний и перемещений.
    /// </remarks>
    [HttpPut]
    public async Task<SettingsDto> Update(SettingsDto req, CancellationToken ct)
    {
        var s = await db.AccountingSettings.SingleAsync(ct);
        s.PeriodClosedUntil = req.PeriodClosedUntil;
        s.AllowNegativeSales = req.AllowNegativeSales;
        s.AllowNegativeOther = req.AllowNegativeOther;
        s.BusinessDayStart = req.BusinessDayStart;
        await db.SaveChangesAsync(ct);
        return req;
    }
}
