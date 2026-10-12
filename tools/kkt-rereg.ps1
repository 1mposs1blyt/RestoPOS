# =============================================================================
#  Перерегистрация ККТ АТОЛ — «оживление» отладочного ФН.
#
#  ЗАЧЕМ
#  -----
#  У отладочного ФН (заводской номер начинается на 9999, тип LIBFPTR_FNT_DEBUG)
#  ресурс ограничен СРОКОМ с момента фискализации, а не объёмом. Когда срок
#  выходит, накопитель перестаёт принимать документы: касса отвечает «Ресурс
#  хранения ФД исчерпан», а на ленте печатается «ДОКУМЕНТ АННУЛИРОВАН».
#
#  Замена накопителя при этом не нужна. Производитель даёт отладочному ФН
#  30 регистраций именно затем, чтобы его периодически перерегистрировали:
#  каждая перерегистрация открывает новый срок.
#
#  Замеры на этой кассе (24.08.2026):
#      тип ФН .................. отладочный
#      состояние ............... фискальный режим (рабочее)
#      ресурс исчерпан ......... нет
#      требует замены .......... нет
#      годен до ................ 01.08.2027
#      перерегистраций осталось. 29 из 30
#      зарегистрирован ......... 17.06.2026
#      свободных ФД ............ 0
#      документов записано ..... 4
#
#  Последние две строки и есть доказательство: записано четыре документа,
#  а свободных ноль — значит упёрлись не в объём, а в срок.
#
#  ЧТО ДЕЛАЕТ СКРИПТ
#  -----------------
#  Одну операцию: перерегистрацию с указанием причины (реквизит 1205).
#  Реквизиты организации не трогает — они уже записаны в ККТ и остаются
#  как есть. Сначала печатает состояние ФН, потом выполняет операцию,
#  потом печатает состояние снова, чтобы было видно результат.
#
#  ЭТО НЕОБРАТИМО. Операция тратит одну из 29 перерегистраций и пишет
#  фискальный документ от имени организации, на которую зарегистрирована
#  ККТ. Запускайте, только если понимаете это.
#
#  ЗАПУСК
#  ------
#      powershell -NoProfile -ExecutionPolicy Bypass -File tools\kkt-rereg.ps1
#
#  По умолчанию идёт «сухой прогон»: скрипт только читает состояние и ничего
#  не пишет. Чтобы выполнить операцию, добавьте -Apply:
#
#      powershell -NoProfile -ExecutionPolicy Bypass -File tools\kkt-rereg.ps1 -Apply
#
#  Код причины (реквизит 1205) обязателен и не может быть нулём — именно
#  на этом падает утилита АТОЛ с ошибкой «[148] Ошибка программирования
#  реквизита 1205». Значение по умолчанию — 8 («изменение настроек ККТ»).
#  Если ККТ откажет, попробуйте другое: 1, 2, 4. Отказ происходит ДО записи
#  в накопитель и попытку не тратит.
# =============================================================================

param(
    [string] $Ip       = '192.168.1.223',
    [int]    $Port     = 5555,
    [int]    $Reason   = 8,
    [string] $Cashier  = 'Tech Support',
    [switch] $Apply
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$dll = 'C:\Program Files\ATOL\Drivers10\KKT\bin\Atol.Drivers10.Fptr.dll'
if (-not (Test-Path $dll)) { throw "Драйвер ДТО-10 не найден: $dll" }

[Reflection.Assembly]::LoadFrom($dll) | Out-Null
$f = New-Object Atol.Drivers10.Fptr.Fptr
$C = [Atol.Drivers10.Fptr.Constants]

# Model обязателен: без него setSettings молча не применяет НИЧЕГО,
# и драйвер продолжает работать на настройках, сохранённых утилитой.
$settings = @{
    'Model'     = 500          # ATOL_AUTO
    'Port'      = 2            # TCP/IP (1 — это USB)
    'IPAddress' = $Ip
    'IPPort'    = $Port
} | ConvertTo-Json -Compress

if ($f.setSettings($settings) -lt 0) { throw "Настройки связи не приняты: $($f.errorDescription())" }
$f.open() | Out-Null
if (-not $f.isOpened()) { throw "ККТ не отвечает по ${Ip}:${Port} : $($f.errorDescription())" }

function Show-Fn([string] $when) {
    $f.setParam($C::LIBFPTR_PARAM_FN_DATA_TYPE, $C::LIBFPTR_FNDT_FREE_MEMORY)
    $free = if ($f.fnQueryData() -ge 0) { $f.getParamInt($C::LIBFPTR_PARAM_FREE_DOCUMENT_COUNT) } else { '?' }

    $f.setParam($C::LIBFPTR_PARAM_FN_DATA_TYPE, $C::LIBFPTR_FNDT_VALIDITY)
    if ($f.fnQueryData() -ge 0) {
        $left  = $f.getParamInt($C::LIBFPTR_PARAM_REGISTRATIONS_REMAIN)
        $until = $f.getParamDateTime($C::LIBFPTR_PARAM_DATE_TIME)
    } else { $left = '?'; $until = '?' }

    "{0,-8} свободных ФД: {1,-6} перерегистраций осталось: {2,-4} годен до: {3}" -f $when, $free, $left, $until
}

Show-Fn 'ДО'

if (-not $Apply) {
    ''
    'Сухой прогон: ничего не записано.'
    'Чтобы выполнить перерегистрацию, добавьте ключ -Apply'
    $f.close() | Out-Null
    return
}

# Кассир обязателен: перерегистрация — фискальный документ.
$f.setParam(1021, $Cashier)
if ($f.operatorLogin() -lt 0) { throw "Кассир не зарегистрирован: $($f.errorDescription())" }

# Версию ФФД драйвер требует в самой операции и по умолчанию не подставляет:
# без неё перерегистрация отваливается с «[190] Неверная версия ФФД».
# Берём ту, на которой ККТ уже работает, а не константу наугад.
$f.setParam($C::LIBFPTR_PARAM_FN_DATA_TYPE, $C::LIBFPTR_FNDT_FFD_VERSIONS)
if ($f.fnQueryData() -lt 0) { throw "Версия ФФД не прочитана: $($f.errorDescription())" }
$ffd = $f.getParamInt($C::LIBFPTR_PARAM_FFD_VERSION)
$ffdDevice = $f.getParamInt($C::LIBFPTR_PARAM_DEVICE_FFD_VERSION)
$ffdFn = $f.getParamInt($C::LIBFPTR_PARAM_FN_MAX_FFD_VERSION)
"ФФД: текущая $ffd, ККТ поддерживает до $ffdDevice, ФН до $ffdFn"

$f.setParam($C::LIBFPTR_PARAM_FN_OPERATION_TYPE, $C::LIBFPTR_FNOP_CHANGE_PARAMETERS)
$f.setParam($C::LIBFPTR_PARAM_FFD_VERSION, $ffd)
$f.setParam(1205, $Reason)

''
"Перерегистрация, причина (1205) = $Reason ..."
$rc = $f.fnOperation()

if ($rc -lt 0) {
    "ОТКАЗ [$($f.errorCode())]: $($f.errorDescription())"
    'Накопитель не изменён, попытка не потрачена.'
} else {
    'Готово.'
}

''
Show-Fn 'ПОСЛЕ'
$f.close() | Out-Null
