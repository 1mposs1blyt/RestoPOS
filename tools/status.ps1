# =============================================================================
#  Что сейчас делает автономный агент.
#
#  Запуск:  powershell -NoProfile -File tools\status.ps1
#           powershell -NoProfile -File tools\status.ps1 -Watch   (обновление раз в 5 с)
#
#  ЗАЧЕМ ЭТО ОТДЕЛЬНО ОТ ЛОГА
#  --------------------------
#  daemon.log пишется только на границах задач, а задача идёт пять-десять
#  минут. Всё это время лог молчит, и «работает» со стороны неотличимо
#  от «повисло». Признак движения внутри задачи — не лог, а рабочее дерево:
#  пока агент работает, файлы в нём меняются. Скрипт показывает и то, и другое
#  разом, поэтому отвечает на вопрос, на который лог сам по себе не отвечает.
# =============================================================================

param([switch] $Watch)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Get-Line([string] $text, [string] $color) {
    Write-Host $text -ForegroundColor $color
}

function Show-Status {

    $now = Get-Date

    Get-Line ("=" * 64) 'DarkGray'
    Get-Line ("  СОСТОЯНИЕ АГЕНТА          {0}" -f $now.ToString('HH:mm:ss')) 'Cyan'
    Get-Line ("=" * 64) 'DarkGray'
    ''

    # --- Демон ------------------------------------------------------------
    # Живёт ли сам цикл. Если умер он, задач больше никто не возьмёт,
    # и все остальные признаки будут выглядеть нормально ещё минут пять.
    $daemon = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
              Where-Object { $_.CommandLine -like '*daemon.ps1*' }

    if ($daemon) {
        Get-Line ("  Демон .......... работает (PID {0})" -f $daemon.ProcessId) 'Green'
    } else {
        Get-Line '  Демон .......... НЕ ЗАПУЩЕН' 'Red'
        Get-Line '                   запуск: powershell -NoProfile -File daemon.ps1' 'DarkGray'
    }

    # --- Текущая задача ---------------------------------------------------
    # Берём последнюю строку «Беру задачу» и ищем процесс claude, стартовавший
    # рядом с ней по времени. Совпадение секунды старта с записью в логе и есть
    # доказательство, что работает именно наш агент, а не забытая сессия.
    $log = if (Test-Path 'daemon.log') { Get-Content 'daemon.log' -Encoding utf8 } else { @() }
    $taken = $log | Where-Object { $_ -match 'Беру задачу' } | Select-Object -Last 1
    $done  = $log | Where-Object { $_ -match 'Задача выполнена' } | Select-Object -Last 1

    $busy = $false
    if ($taken -and $taken -match '^(\d{2}:\d{2}:\d{2})') {
        $startedAt = [datetime]::ParseExact($matches[1], 'HH:mm:ss', $null)
        # Задача считается идущей, если после «Беру» ещё не было «Выполнена».
        $busy = -not ($done -and ($log.IndexOf($done) -gt $log.IndexOf($taken)))

        if ($busy) {
            $mins = [int]($now - $startedAt).TotalMinutes
            $model = if ($taken -match 'модель:\s*(\w+)') { $matches[1] } else { '?' }
            Get-Line ("  Задача ......... идёт {0} мин, модель {1}" -f $mins, $model) 'Yellow'

            $worker = Get-Process claude -ErrorAction SilentlyContinue |
                      Where-Object { [math]::Abs(($_.StartTime - $startedAt).TotalSeconds) -lt 120 } |
                      Select-Object -First 1
            if ($worker) {
                Get-Line ("  Процесс ........ PID {0}, процессор {1:N0} с" -f $worker.Id, $worker.CPU) 'Gray'
            } else {
                Get-Line '  Процесс ........ НЕ НАЙДЕН — задача, похоже, оборвалась' 'Red'
            }
        } else {
            Get-Line '  Задача ......... пауза между задачами' 'DarkGray'
        }
    }

    # --- Очередь ----------------------------------------------------------
    if (Test-Path 'tasks.md') {
        $text = Get-Content 'tasks.md' -Encoding utf8
        $ok   = ($text | Select-String -Pattern '^\s*-\s*\[x\]').Count
        $left = ($text | Select-String -Pattern '^\s*-\s*\[ \]').Count
        $bad  = ($text | Select-String -Pattern '^\s*-\s*\[!\]').Count

        $line = "  Очередь ........ сделано {0}, осталось {1}" -f $ok, $left
        if ($bad -gt 0) { $line += ", отклонено $bad" }
        Get-Line $line $(if ($left -eq 0) { 'Green' } else { 'Gray' })

        $next = $text | Select-String -Pattern '^\s*-\s*\[ \]' | Select-Object -First 1
        if ($next) {
            $title = ($next.Line -replace '^\s*-\s*\[ \]\s*', '')
            if ($title.Length -gt 52) { $title = $title.Substring(0, 52) + '...' }
            Get-Line ("  Следующая ...... {0}" -f $title) 'DarkGray'
        }
    }

    ''

    # --- Движение в дереве ------------------------------------------------
    # Главный признак: пока задача идёт, файлы меняются. Свежая метка времени
    # доказывает движение вернее любого сообщения в логе.
    $changed = @(git status --short 2>$null | Where-Object { $_ -notmatch 'apps/backend/server/obj' })

    if ($busy) {
        Get-Line '  ПРАВИТ СЕЙЧАС' 'Cyan'
        if ($changed.Count -eq 0) {
            Get-Line '    дерево чистое — агент читает, но ещё не писал' 'DarkGray'
        } else {
            foreach ($c in ($changed | Select-Object -First 6)) {
                $path = ($c -replace '^\s*\S+\s+', '').Trim('"')
                $age = if (Test-Path $path) {
                    $sec = [int]($now - (Get-Item $path).LastWriteTime).TotalSeconds
                    if ($sec -lt 60) { "$sec с назад" } else { "{0} мин назад" -f [int]($sec / 60) }
                } else { '' }
                Get-Line ("    {0,-46} {1}" -f $path, $age) 'Gray'
            }
            if ($changed.Count -gt 6) {
                Get-Line ("    ... и ещё {0}" -f ($changed.Count - 6)) 'DarkGray'
            }
        }
        ''
    }

    # --- Что уже сделано --------------------------------------------------
    Get-Line '  ПОСЛЕДНИЕ КОММИТЫ' 'Cyan'
    git log -5 --format='    %ad  %s' --date=format:'%d.%m %H:%M' 2>$null |
        ForEach-Object { Get-Line $_ 'Gray' }

    ''
    Get-Line '  Остановить агента: New-Item .stop' 'DarkGray'
}

if ($Watch) {
    while ($true) {
        Clear-Host
        Show-Status
        Start-Sleep -Seconds 5
    }
} else {
    Show-Status
}
