using Npgsql;
using server.Data;
using server.repos;
using server.Repositories;
using server.Services;
using System.Data;



var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");


DatabaseInitializer.Initialize(connectionString);

// 2. ����������� IDbConnection ��� Dapper
builder.Services.AddScoped<IDbConnection>(_ => new NpgsqlConnection(connectionString));

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


// --- DI Registration ---
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IRoutesService, RoutesService>();
builder.Services.AddScoped<IHallRepository, HallRepository>();
// -----------------------

// CORS для терминала.
//
// Касса — это отдельное приложение на своём origin (Vite на :1420 в разработке,
// Tauri со своей схемой в сборке), и она шлёт заголовки X-Terminal-Id
// и X-Venue-Id. Браузер на такой запрос делает preflight, и без политики CORS
// он его просто не выпустит: в консоли будет «Failed to fetch», а в логах узла
// не будет ничего — запрос до него не доедет.
//
// Политика дев-режима: конкретные origin'ы, любые заголовки и методы.
// Для прода её надо сузить до адресов терминалов заведения.
builder.Services.AddCors(options =>
{
    options.AddPolicy("terminal", policy => policy
        .WithOrigins("http://localhost:1420", "http://localhost:1430", "tauri://localhost")
        .AllowAnyHeader()
        .AllowAnyMethod());
});


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// До UseAuthorization: preflight (OPTIONS) не несёт авторизации и обязан
// получить ответ раньше, чем до него доберутся проверки прав.
app.UseCors("terminal");

app.UseAuthorization();

app.MapControllers();

app.Run();
