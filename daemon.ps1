# =============================================================================
#  Автономный агент: берёт задачи из tasks.md и выполняет их по одной.
#
#  Останавливается созданием файла .stop в корне репозитория.
#
#  ЧТО ЗДЕСЬ ВАЖНО ПОНИМАТЬ
#  ------------------------
#  Каждый запуск `claude -p` — это НОВАЯ сессия с чистым контекстом. Поэтому
#  контекст между задачами не накапливается, и «очищать» его нечем и незачем:
#  ограничение в 300k действует внутри одной задачи и обслуживается
#  автосжатием (autoCompactWindow в .claude/settings.local.json).
#
#  Отсюда же правило одной задачи за запуск: задача, разбитая на два запуска,
#  теряет между ними всё, что агент понял по дороге.
# =============================================================================

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$TasksFile   = 'tasks.md'
$StopFile    = '.stop'
$LogFile     = 'daemon.log'

# Пауза между попытками, когда что-то пошло не так.
$NetWait     = 30        # сеть отвалилась — она возвращается быстро
$LimitWait   = 900       # лимиты исчерпаны — ждём сброса, 15 минут
$MaxWait     = 3600
$IdleWait    = 60        # задач нет — просто дремлем

# Лестница моделей. Первая — основная; на неё возвращаемся после успеха.
# Сползаем вниз, когда упираемся в лимиты: дешёвая модель, которая работает,
# полезнее дорогой, которая ждёт сброса.
$Models      = @('opus', 'sonnet', 'haiku')
$ModelIndex  = 0

function Log([string] $text, [string] $color = 'Gray') {
    $line = "{0}  {1}" -f (Get-Date -Format 'HH:mm:ss'), $text
    Write-Host $line -ForegroundColor $color
    Add-Content -Path $LogFile -Value $line -Encoding utf8
}

function Has-Tasks {
    if (-not (Test-Path $TasksFile)) { return $false }
    return [bool](Select-String -Path $TasksFile -Pattern '^\s*-\s*\[ \]' -Quiet)
}

Log "Агент запущен. Остановка — создайте файл $StopFile" 'Cyan'

while ($true) {

    if (Test-Path $StopFile) {
        Log 'Найден .stop — завершаюсь.' 'Yellow'
        Remove-Item $StopFile -ErrorAction SilentlyContinue
        break
    }

    if (-not (Has-Tasks)) {
        Log "Невыполненных задач нет. Сплю $IdleWait с." 'DarkGray'
        Start-Sleep -Seconds $IdleWait
        continue
    }

    $model = $Models[$ModelIndex]
    Log "--- Беру задачу, модель: $model ---" 'Green'

    <#
      Сборка держит файлы: пока запущено приложение кассы, cargo не может
      перезаписать desktop.exe и падает с EBUSY. Гасим перед работой —
      это дешевле, чем разбирать потом непонятную ошибку сборки.
    #>
    Get-Process desktop -ErrorAction SilentlyContinue | Stop-Process -Force

    $prompt = @'
Сначала прочти docs/state.md — там состояние работ от прошлой сессии:
чем занят стенд, какие вопросы открыты, чего делать не надо. Контекст между
запусками не переживает ничего, кроме этого файла и CLAUDE.md.

Затем открой tasks.md. Возьми ПЕРВУЮ невыполненную задачу [ ] и выполни её
целиком, строго следуя CLAUDE.md.

Обязательно:
- прогони `pnpm verify`; если трогал src-tauri — ещё `cargo test --lib`
  и `cargo check --release`;
- не бери следующую задачу, даже если эта оказалась короткой;
- если задача сформулирована неверно или невыполнима — не выдумывай обходной
  путь: отметь её как [!] с одной строкой объяснения и остановись.

Когда всё зелёное:
1. обнови docs/state.md — что сделано, что осталось открытым, чем занят стенд;
   сделанное оттуда убирай, а не копи;
2. отметь задачу [x] в tasks.md;
3. сделай коммит с осмысленным сообщением на русском.

Если по дороге контекст подошёл к пределу и началось сжатие — сперва запиши
состояние в docs/state.md, иначе следующая сессия начнёт с нуля.
'@

    # Вывод забираем целиком: по нему отличаем лимиты от обрыва связи.
    $output = & claude --dangerously-skip-permissions --model $model -p $prompt 2>&1 | Out-String
    $code = $LASTEXITCODE

    Write-Host $output

    if ($code -eq 0) {
        Log 'Задача выполнена.' 'Green'
        # Успех — возвращаемся на основную модель.
        $ModelIndex = 0
        Start-Sleep -Seconds 5
        continue
    }

    <#
      Разбираем, ЧЕМ именно кончилось. Экспоненциальная пауза на все случаи
      жизни — плохая замена этому: обрыв связи лечится тридцатью секундами,
      а исчерпанные лимиты не лечатся вообще, их надо переждать либо уйти
      на модель подешевле.
    #>
    $isLimit = $output -match 'usage limit|rate.?limit|quota|429|limit reached|Лимит'
    $isNet   = $output -match 'API RESPONSE FAILED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|network|fetch failed|Connection error'

    if ($isNet -and -not $isLimit) {
        Log "Связь оборвалась. Повтор через $NetWait с." 'Yellow'
        Start-Sleep -Seconds $NetWait
        continue
    }

    if ($isLimit) {
        if ($ModelIndex -lt ($Models.Count - 1)) {
            $ModelIndex++
            Log "Лимиты исчерпаны. Перехожу на модель: $($Models[$ModelIndex])" 'Yellow'
            Start-Sleep -Seconds 10
        } else {
            Log "Лимиты исчерпаны на всех моделях. Жду сброса $LimitWait с." 'Red'
            Start-Sleep -Seconds $LimitWait
        }
        continue
    }

    # Непонятный отказ: не лимит и не сеть. Скорее всего, сама задача.
    # Пауза растёт, чтобы не молотить впустую по сломанному заданию.
    Log "Агент завершился с кодом $code. Пауза $NetWait с." 'Red'
    Start-Sleep -Seconds $NetWait
    $NetWait = [Math]::Min($NetWait * 2, $MaxWait)
}
