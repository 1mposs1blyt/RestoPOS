using Microsoft.EntityFrameworkCore;
using StockApi.Data;

namespace StockApi.Services;

// Сердце учёта: проведение и отмена проведения документов.
//
// Проведение = в одной транзакции:
//   1. проверить, что документ черновик и период не закрыт;
//   2. превратить строки документа в движения (продажи — раскладкой по техкарте);
//   3. посчитать себестоимость каждого движения по средней цене;
//   4. обновить остатки и проверить уход в минус;
//   5. пометить документ проведённым.
// Если на любом шаге ошибка — откатывается всё, документ остаётся черновиком
// (ровно как АЗ 0003 в iiko, который упёрся в запрет минуса).
public class PostingService(StockDbContext db, BusinessClock clock)
{
    private const int MaxRecipeDepth = 10;

    public async Task PostAsync(Guid documentId, CancellationToken ct = default)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await LockAsync($"doc:{documentId}", ct);

        var doc = await db.Documents.Include(d => d.Items)
                      .FirstOrDefaultAsync(d => d.Id == documentId, ct)
                  ?? throw DomainException.NotFound("Документ");

        if (doc.Status != DocumentStatus.Draft)
            throw DomainException.Conflict("Провести можно только черновик");

        var settings = await db.AccountingSettings.SingleAsync(ct);
        var localDate = clock.LocalDate(doc.DocDate);
        EnsurePeriodOpen(settings, localDate);

        var stores = StoresOf(doc);
        foreach (var storeId in stores) await LockAsync($"store:{storeId}", ct);
        await EnsureNoLaterMovementsAsync(doc, stores, ct);

        var allowNegative = doc.Type == DocumentType.SalesAct
            ? settings.AllowNegativeSales
            : settings.AllowNegativeOther;

        var storeId0 = doc.StoreId ?? throw new DomainException("У документа не указан склад");

        foreach (var item in doc.Items.OrderBy(i => i.LineNo))
        {
            switch (doc.Type)
            {
                case DocumentType.IncomingInvoice:
                    {
                        var cost = item.Amount ?? (item.Price ?? 0) * item.Quantity;
                        await ApplyAsync(doc, item, storeId0, item.ProductId, item.Quantity, cost, allowNegative, ct);
                        break;
                    }

                case DocumentType.SalesAct:
                case DocumentType.WriteoffAct:
                    {
                        // Блюдо раскладываем на ингредиенты по техкарте на дату документа
                        var parts = await ExplodeAsync(item.ProductId, item.Quantity, localDate, 0, ct);
                        foreach (var (productId, qty) in parts)
                            await ApplyAsync(doc, item, storeId0, productId, -qty, null, allowNegative, ct);
                        break;
                    }

                case DocumentType.Transfer:
                    {
                        // Со склада-источника уходит по его средней цене,
                        // на склад-получатель приходит ровно на эту же сумму
                        var outCost = await ApplyAsync(doc, item, storeId0, item.ProductId, -item.Quantity, null, allowNegative, ct);
                        await ApplyAsync(doc, item, doc.StoreToId!.Value, item.ProductId, item.Quantity, -outCost, allowNegative, ct);
                        break;
                    }

                case DocumentType.Inventory:
                    {
                        // В строке инвентаризации — фактическое количество.
                        // Движение = факт − учётный остаток (излишек или недостача).
                        var balance = await GetBalanceAsync(storeId0, item.ProductId, ct);
                        var delta = item.Quantity - balance.Quantity;
                        if (delta != 0)
                            await ApplyAsync(doc, item, storeId0, item.ProductId, delta, null, true, ct);
                        break;
                    }
            }
        }

        var now = DateTime.UtcNow;
        doc.Status = DocumentStatus.Posted;
        doc.PostedAt = now;
        doc.UpdatedAt = now;
        doc.Revision++;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    public async Task UnpostAsync(Guid documentId, CancellationToken ct = default)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await LockAsync($"doc:{documentId}", ct);

        var doc = await db.Documents.FirstOrDefaultAsync(d => d.Id == documentId, ct)
                  ?? throw DomainException.NotFound("Документ");

        if (doc.Status != DocumentStatus.Posted)
            throw DomainException.Conflict("Отменить проведение можно только у проведённого документа");

        var settings = await db.AccountingSettings.SingleAsync(ct);
        EnsurePeriodOpen(settings, clock.LocalDate(doc.DocDate));

        var stores = StoresOf(doc);
        foreach (var storeId in stores) await LockAsync($"store:{storeId}", ct);
        await EnsureNoLaterMovementsAsync(doc, stores, ct);

        var movements = await db.StockMovements.Where(m => m.DocumentId == doc.Id).ToListAsync(ct);
        foreach (var m in movements)
        {
            var balance = await GetBalanceAsync(m.StoreId, m.ProductId, ct);
            balance.Quantity -= m.Quantity;
            balance.TotalCost -= m.CostAmount;
            balance.UpdatedAt = DateTime.UtcNow;
        }
        db.StockMovements.RemoveRange(movements);

        doc.Status = DocumentStatus.Draft;
        doc.PostedAt = null;
        doc.UpdatedAt = DateTime.UtcNow;
        doc.Revision++;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    // ------------------------------------------------------------------
    // Одно движение: считаем себестоимость, двигаем остаток, пишем строку движения.
    // Возвращает себестоимость движения (со знаком).
    // ------------------------------------------------------------------
    private async Task<decimal> ApplyAsync(
        Document doc, DocumentItem item, Guid storeId, Guid productId,
        decimal qty, decimal? knownCost, bool allowNegative, CancellationToken ct)
    {
        var balance = await GetBalanceAsync(storeId, productId, ct);

        decimal cost;
        if (knownCost is decimal k)
        {
            cost = Math.Round(k, 2);
        }
        else if (qty < 0 && balance.Quantity + qty == 0)
        {
            // Забираем всё до нуля — списываем всю сумму, чтобы не копились копейки от округлений
            cost = -balance.TotalCost;
        }
        else
        {
            cost = Math.Round(qty * await UnitCostAsync(balance, ct), 2);
        }

        balance.Quantity += qty;
        balance.TotalCost += cost;
        balance.UpdatedAt = DateTime.UtcNow;

        if (balance.Quantity < 0 && !allowNegative)
        {
            var name = (await db.Products.FindAsync([productId], ct))?.Name ?? productId.ToString();
            throw DomainException.Conflict(
                $"Недостаточно «{name}» на складе: остаток станет {balance.Quantity:0.######}. " +
                "Уход в минус для этого типа документа запрещён настройками.");
        }

        db.StockMovements.Add(new StockMovement
        {
            DocumentId = doc.Id,
            DocumentItemId = item.Id,
            MovementDate = doc.DocDate,
            StoreId = storeId,
            ProductId = productId,
            Quantity = qty,
            CostAmount = cost
        });

        return cost;
    }

    // Средняя цена единицы. Если остатка нет (ноль или минус) — берём цену последнего прихода.
    private async Task<decimal> UnitCostAsync(StockBalance balance, CancellationToken ct)
    {
        if (balance.Quantity > 0)
            return balance.TotalCost / balance.Quantity;

        return await db.StockMovements
            .Where(m => m.ProductId == balance.ProductId && m.Quantity > 0 && m.CostAmount > 0)
            .OrderByDescending(m => m.MovementDate).ThenByDescending(m => m.Id)
            .Select(m => m.CostAmount / m.Quantity)
            .FirstOrDefaultAsync(ct);
    }

    // Находит остаток (уже отслеживаемый в этой транзакции или из базы), либо создаёт новый
    private async Task<StockBalance> GetBalanceAsync(Guid storeId, Guid productId, CancellationToken ct)
    {
        var balance = await db.StockBalances.FindAsync([storeId, productId], ct);
        if (balance is null)
        {
            balance = new StockBalance { StoreId = storeId, ProductId = productId, UpdatedAt = DateTime.UtcNow };
            db.StockBalances.Add(balance);
        }
        return balance;
    }

    // ------------------------------------------------------------------
    // Раскладка по техкарте (рекурсивно: блюдо -> заготовка -> ингредиенты)
    // ------------------------------------------------------------------
    private async Task<List<(Guid ProductId, decimal Qty)>> ExplodeAsync(
        Guid productId, decimal qty, DateOnly date, int depth, CancellationToken ct)
    {
        if (depth > MaxRecipeDepth)
            throw new DomainException("Слишком глубокая вложенность техкарт — похоже, где-то цикл");

        var product = await db.Products.FindAsync([productId], ct)
                      ?? throw DomainException.NotFound("Товар");

        if (product.Type == ProductType.Service)
            return [];                       // услуги на складе не живут

        if (product.Type == ProductType.Goods || product.WriteoffMethod == WriteoffMethod.Self)
            return [(productId, qty)];

        var recipe = await db.Recipes.Include(r => r.Items)
            .Where(r => r.ProductId == productId
                        && r.DateFrom <= date
                        && (r.DateTo == null || r.DateTo >= date))
            .OrderByDescending(r => r.DateFrom)
            .FirstOrDefaultAsync(ct);

        // Нет техкарты на эту дату — списываем само блюдо (так делает и iiko, ты это видел с "попить")
        if (recipe is null)
            return [(productId, qty)];

        var result = new List<(Guid, decimal)>();
        foreach (var ri in recipe.Items.OrderBy(i => i.LineNo))
        {
            var ingredientQty = Math.Round(ri.Gross / recipe.Portions * qty, 6);
            result.AddRange(await ExplodeAsync(ri.IngredientId, ingredientQty, date, depth + 1, ct));
        }
        return result;
    }

    // ------------------------------------------------------------------
    // Проверки и блокировки
    // ------------------------------------------------------------------
    public static void EnsurePeriodOpen(AccountingSettings settings, DateOnly localDate)
    {
        if (settings.PeriodClosedUntil is DateOnly closed && localDate <= closed)
            throw DomainException.Conflict($"Период по {closed:dd.MM.yyyy} включительно закрыт для изменений");
    }

    // MVP-правило: нельзя проводить/отменять документ задним числом, если на его складах
    // уже есть движения позже. Иначе средняя себестоимость всех последующих продаж
    // становится неверной, а пересчёт мы пока не умеем.
    private async Task EnsureNoLaterMovementsAsync(Document doc, List<Guid> stores, CancellationToken ct)
    {
        var later = await db.StockMovements
            .Where(m => stores.Contains(m.StoreId) && m.MovementDate > doc.DocDate && m.DocumentId != doc.Id)
            .OrderBy(m => m.MovementDate)
            .Select(m => (DateTime?)m.MovementDate)
            .FirstOrDefaultAsync(ct);

        if (later is not null)
            throw DomainException.Conflict(
                $"На складе уже есть проведённые документы позже ({later:dd.MM.yyyy HH:mm} UTC). " +
                "Задним числом проводить пока нельзя.");
    }

    private static List<Guid> StoresOf(Document doc) =>
        new[] { doc.StoreId, doc.StoreToId }
            .Where(s => s is not null).Select(s => s!.Value)
            .Distinct().OrderBy(s => s).ToList();

    // Блокировка Postgres до конца транзакции: два проведения одного документа
    // или по одному складу не пойдут параллельно и не испортят остатки.
    private Task LockAsync(string key, CancellationToken ct) =>
        db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtext({key}))", ct);
}