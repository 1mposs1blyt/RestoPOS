using StockApi.Data;

namespace StockApi;

// ---------- Справочники ----------
public record UnitDto(Guid Id, string Name, string ShortName);
public record CreateUnitRequest(string Name, string ShortName);

public record StoreDto(Guid Id, string Name);
public record CreateStoreRequest(string Name);

public record SupplierDto(Guid Id, string Name, string? Inn, string? Phone);
public record CreateSupplierRequest(string Name, string? Inn, string? Phone);

public record ProductGroupDto(Guid Id, Guid? ParentId, string Name);
public record CreateProductGroupRequest(string Name, Guid? ParentId);

public record ProductDto(
    Guid Id, string Article, string Name, ProductType Type,
    Guid UnitId, string Unit, WriteoffMethod WriteoffMethod,
    decimal? SalePrice, Guid? GroupId);

public record CreateProductRequest(
    string Name, ProductType Type, Guid UnitId,
    string? Article = null, Guid? GroupId = null,
    WriteoffMethod WriteoffMethod = WriteoffMethod.Ingredients,
    decimal? SalePrice = null);

// ---------- Техкарты ----------
public record RecipeItemRequest(Guid IngredientId, decimal Gross, decimal ColdLossPct = 0, decimal HotLossPct = 0);
public record CreateRecipeRequest(DateOnly DateFrom, List<RecipeItemRequest> Items, decimal Portions = 1);

public record RecipeItemDto(
    int LineNo, Guid IngredientId, string Ingredient, string Unit,
    decimal Gross, decimal ColdLossPct, decimal HotLossPct, decimal Net);
public record RecipeDto(Guid Id, Guid ProductId, DateOnly DateFrom, DateOnly? DateTo, decimal Portions, List<RecipeItemDto> Items);

// ---------- Документы ----------
public record DocumentItemRequest(Guid ProductId, decimal Quantity, decimal? Price = null, decimal? Amount = null);

public record CreateDocumentRequest(
    DocumentType Type,
    DateTimeOffset DocDate,
    Guid StoreId,
    List<DocumentItemRequest> Items,
    string? Number = null,
    Guid? StoreToId = null,
    Guid? SupplierId = null,
    string? WriteoffReason = null,
    string? Comment = null);

public record DocumentItemDto(
    Guid Id, int LineNo, Guid ProductId, string Product, string Unit,
    decimal Quantity, decimal? Price, decimal? Amount);

public record DocumentDto(
    Guid Id, DocumentType Type, string Number, DateTime DocDate, DocumentStatus Status,
    Guid? StoreId, Guid? StoreToId, Guid? SupplierId, string? WriteoffReason, string? Comment,
    bool IsAutomatic, DateTime CreatedAt, DateTime? PostedAt, decimal TotalAmount,
    List<DocumentItemDto> Items);

public record DocumentListItemDto(
    Guid Id, DocumentType Type, string Number, DateTime DocDate, DocumentStatus Status,
    Guid? StoreId, decimal TotalAmount);

// ---------- Остатки и движения ----------
public record BalanceDto(
    Guid StoreId, string Store, Guid ProductId, string Product, string Unit,
    decimal Quantity, decimal TotalCost, decimal? AvgCost);

public record MovementDto(
    long Id, DateTime MovementDate, Guid DocumentId, DocumentType DocumentType, string DocumentNumber,
    Guid StoreId, Guid ProductId, string Product, decimal Quantity, decimal CostAmount);

public record ReconciliationIssueDto(Guid StoreId, Guid ProductId, decimal BalanceQuantity, decimal MovementsQuantity);

// ---------- Настройки ----------
public record SettingsDto(
    DateOnly? PeriodClosedUntil, bool AllowNegativeSales, bool AllowNegativeOther, TimeOnly BusinessDayStart);