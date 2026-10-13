using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace StockApi.Data;

// Схемой пока владеют SQL-скрипты (01_schema.sql), миграций EF нет.
// Имена таблиц/колонок в snake_case подставляет UseSnakeCaseNamingConvention():
// DbSet "StockMovements" -> таблица stock_movements, свойство DocDate -> колонка doc_date.
public class StockDbContext(DbContextOptions<StockDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<ProductGroup> ProductGroups => Set<ProductGroup>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeItem> RecipeItems => Set<RecipeItem>();
    public DbSet<CashShift> CashShifts => Set<CashShift>();
    public DbSet<AccountingSettings> AccountingSettings => Set<AccountingSettings>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentItem> DocumentItems => Set<DocumentItem>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<StockBalance> StockBalances => Set<StockBalance>();

    protected override void ConfigureConventions(ModelConfigurationBuilder b)
    {
        b.Properties<ProductType>().HaveConversion<SnakeEnumConverter<ProductType>>();
        b.Properties<WriteoffMethod>().HaveConversion<SnakeEnumConverter<WriteoffMethod>>();
        b.Properties<DocumentType>().HaveConversion<SnakeEnumConverter<DocumentType>>();
        b.Properties<DocumentStatus>().HaveConversion<SnakeEnumConverter<DocumentStatus>>();
    }

    protected override void OnModelCreating(ModelBuilder m)
    {
        // Явно задаём имена таблиц, чтобы не зависеть от того,
        // как называются DbSet-свойства.
        m.Entity<User>().ToTable("users");
        m.Entity<Unit>().ToTable("units");
        m.Entity<ProductGroup>().ToTable("product_groups");
        m.Entity<Product>().ToTable("products");
        m.Entity<Store>().ToTable("stores");
        m.Entity<Supplier>().ToTable("suppliers");
        m.Entity<Recipe>().ToTable("recipes");
        m.Entity<RecipeItem>().ToTable("recipe_items");
        m.Entity<CashShift>().ToTable("cash_shifts");
        m.Entity<AccountingSettings>().ToTable("accounting_settings");
        m.Entity<Document>().ToTable("documents");
        m.Entity<DocumentItem>().ToTable("document_items");
        m.Entity<StockMovement>().ToTable("stock_movements");
        m.Entity<StockBalance>().ToTable("stock_balances");

        m.Entity<AccountingSettings>().Property(x => x.Id).ValueGeneratedNever();
        m.Entity<StockMovement>().Property(x => x.Id).UseIdentityAlwaysColumn();
        m.Entity<StockBalance>().HasKey(x => new { x.StoreId, x.ProductId });
        m.Entity<RecipeItem>().Ignore(x => x.Net);
    }
}

// Enum <-> строка в snake_case. IncomingInvoice <-> "incoming_invoice".
public class SnakeEnumConverter<T>() : ValueConverter<T, string>(
    v => ToSnake(v.ToString()),
    s => Enum.Parse<T>(s.Replace("_", ""), true))
    where T : struct, Enum
{
    public static string ToSnake(string name)
    {
        var sb = new StringBuilder(name.Length + 8);
        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            if (char.IsUpper(c) && i > 0) sb.Append('_');
            sb.Append(char.ToLowerInvariant(c));
        }
        return sb.ToString();
    }
}