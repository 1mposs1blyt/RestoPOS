using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using StockApi.Data;
using StockApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<StockDbContext>(o => o
    .UseNpgsql(builder.Configuration.GetConnectionString("Stock"))
    .UseSnakeCaseNamingConvention());

builder.Services.AddSingleton<BusinessClock>();
builder.Services.AddScoped<PostingService>();

builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
        // Перечисления в JSON строками, как в базе: "incoming_invoice", "goods"
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower)));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Stock API — складской учёт", Version = "v1" });

    // Описания ручек из /// комментариев в контроллерах
    var xml = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    if (File.Exists(xml)) c.IncludeXmlComments(xml);
});

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<DomainExceptionHandler>();

var app = builder.Build();

app.UseExceptionHandler();

// Тестовая морда из wwwroot/index.html открывается по корневому адресу
app.UseDefaultFiles();
app.UseStaticFiles();

// Сваггер включён всегда, пока это дев-проект. В проде стоит спрятать.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Stock API v1");
    c.RoutePrefix = "swagger";
});

app.MapControllers();

app.Run();