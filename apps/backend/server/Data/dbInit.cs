using DbUp;
using DbUp.Postgresql; 
using System.Reflection;


namespace server.Data
{
    public static class DatabaseInitializer
    {
        public static void Initialize(string connectionString)
        {
            // Создаем БД, если она еще не создана
            //EnsureDatabase.For.PostgresqlDatabase(connectionString); 

            // Накатываем эмбеднутые SQL-скрипты
            var upgrader = DeployChanges.To
                .PostgresqlDatabase(connectionString)
                .WithScriptsEmbeddedInAssembly(Assembly.GetExecutingAssembly())
                .LogToConsole()
                .Build();

            var result = upgrader.PerformUpgrade();

            if (!result.Successful)
            {
                throw new Exception("Ошибка миграции БД", result.Error);
            }
        }
    }
}
