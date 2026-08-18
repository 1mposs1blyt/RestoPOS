var builder = WebApplication.CreateBuilder(args);

// Строка подключения к вашему Docker-контейнеру
builder.Configuration["ConnectionStrings:DefaultConnection"] = "Host=127.0.0.1;Port=5447;Database=resto-db;Username=postgres;Password=resto_pass";
builder.Configuration["ConnectionStrings:PostgreSQL"] = "Host=127.0.0.1;Port=5447;Database=resto-db;Username=postgres;Password=resto_pass";

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Регистрируем репозитории бэкенда для Dependency Injection
builder.Services.AddScoped<server.Repositories.IAuthRepository, server.Repositories.AuthRepository>();

// Правильная регистрация интерфейса и класса схемы зала
builder.Services.AddScoped<server.repos.IHallRepository, server.Repositories.HallRepository>();

// Регистрируем сервисы бэкенда для Dependency Injection
builder.Services.AddScoped<server.Services.IRoutesService, server.Services.RoutesService>();

builder.Services.AddScoped<server.Repositories.IMenuRepository, server.Repositories.MenuRepository>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:1420", "http://127.0.0.1:1420")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();
app.UseCors();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
