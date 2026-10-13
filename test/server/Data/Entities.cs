namespace StockApi.Data;

// Перечисления хранятся в базе строками в snake_case: Goods -> "goods",
// IncomingInvoice -> "incoming_invoice" (см. SnakeEnumConverter).

public enum ProductType { Goods, Dish, Prepared, Service }
public enum WriteoffMethod { Ingredients, Self }
public enum DocumentType { IncomingInvoice, SalesAct, WriteoffAct, Transfer, Inventory }
public enum DocumentStatus { Draft, Posted, Deleted }

// ------------------------------------------------------------------
// Справочники
// ------------------------------------------------------------------

public class User
{
    public Guid Id { get; set; }
    public string Login { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

public class Unit
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string ShortName { get; set; } = "";
}

public class ProductGroup
{
    public Guid Id { get; set; }
    public Guid? ParentId { get; set; }
    public string Name { get; set; } = "";
    public bool IsDeleted { get; set; }
}

public class Product
{
    public Guid Id { get; set; }
    public Guid? GroupId { get; set; }
    public string Article { get; set; } = "";
    public string Name { get; set; } = "";
    public ProductType Type { get; set; }
    public Guid UnitId { get; set; }
    public Unit Unit { get; set; } = null!;
    public WriteoffMethod WriteoffMethod { get; set; } = WriteoffMethod.Ingredients;
    public decimal? SalePrice { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int Revision { get; set; } = 1;
}

public class Store
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public bool IsDeleted { get; set; }
}

public class Supplier
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Inn { get; set; }
    public string? Phone { get; set; }
    public bool IsDeleted { get; set; }
}

// ------------------------------------------------------------------
// Техкарты
// ------------------------------------------------------------------

public class Recipe
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public DateOnly DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    public decimal Portions { get; set; } = 1;   // норма закладки
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RecipeItem> Items { get; set; } = [];
}

public class RecipeItem
{
    public Guid Id { get; set; }
    public Guid RecipeId { get; set; }
    public int LineNo { get; set; }
    public Guid IngredientId { get; set; }
    public Product Ingredient { get; set; } = null!;
    public decimal Gross { get; set; }           // брутто
    public decimal ColdLossPct { get; set; }
    public decimal HotLossPct { get; set; }

    // нетто после обеих обработок — считаем, а не храним
    public decimal Net => Gross * (1 - ColdLossPct / 100) * (1 - HotLossPct / 100);
}

// ------------------------------------------------------------------
// Смены и настройки
// ------------------------------------------------------------------

public class CashShift
{
    public Guid Id { get; set; }
    public int Number { get; set; }
    public DateOnly BusinessDate { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public Guid? OpenedBy { get; set; }
    public Guid? ClosedBy { get; set; }
}

public class AccountingSettings
{
    public int Id { get; set; } = 1;
    public DateOnly? PeriodClosedUntil { get; set; }
    public bool AllowNegativeSales { get; set; } = true;
    public bool AllowNegativeOther { get; set; }
    public TimeOnly BusinessDayStart { get; set; } = new(6, 0);
    public string CostMethod { get; set; } = "moving_average";
}

// ------------------------------------------------------------------
// Документы
// ------------------------------------------------------------------

public class Document
{
    public Guid Id { get; set; }
    public DocumentType Type { get; set; }
    public string Number { get; set; } = "";
    public DateTime DocDate { get; set; }          // всегда UTC
    public DocumentStatus Status { get; set; } = DocumentStatus.Draft;
    public Guid? StoreId { get; set; }
    public Guid? StoreToId { get; set; }
    public Guid? SupplierId { get; set; }
    public Guid? CashShiftId { get; set; }
    public string? WriteoffReason { get; set; }
    public bool IsAutomatic { get; set; }
    public string? Comment { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PostedAt { get; set; }
    public int Revision { get; set; } = 1;
    public List<DocumentItem> Items { get; set; } = [];
}

public class DocumentItem
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public int LineNo { get; set; }
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal? Price { get; set; }
    public decimal? Amount { get; set; }
}

// ------------------------------------------------------------------
// Движения и остатки
// ------------------------------------------------------------------

public class StockMovement
{
    public long Id { get; set; }
    public Guid DocumentId { get; set; }
    public Guid? DocumentItemId { get; set; }
    public DateTime MovementDate { get; set; }
    public Guid StoreId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }     // + приход, − расход
    public decimal CostAmount { get; set; }   // со знаком
}

public class StockBalance
{
    public Guid StoreId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal TotalCost { get; set; }
    public DateTime UpdatedAt { get; set; }
}