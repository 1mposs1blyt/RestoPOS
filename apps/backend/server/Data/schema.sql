-- Каноническая схема RestoPOS для PostgreSQL.
--
-- Применить:  psql -U postgres -v ON_ERROR_STOP=1 -f apps/backend/schema.sql
--
-- Проверена на PostgreSQL 16. Черновик сервера на Fastify удалён (коммит
-- «удаление TS сервера»): узел пишется на C#/C++, и этот файл — источник
-- истины по схеме, а не выгрузка из ORM.
--
-- ЧТО ЗДЕСЬ ВЗЯТО ИЗ iiko
--
-- Схема iikoRMS (`docs/script.sql`, 192 таблицы, MS SQL Server) разобрана
-- в `docs/iiko-reference.md`. Скопировать её таблицы напрямую нельзя, и это
-- не выбор, а факт: **основного домена в ней нет**. Ни `Product`, ни `Employee`,
-- ни `Department`, ни `Table` там не существует — всё это лежит в одной таблице
-- `entity` XML-блобом:
--
--     entity(id, deleted, lastModifyNode, revision, type nvarchar(64), xml ntext)
--
-- Тип строки задан колонкой `type`, содержимое — XML, разбирать который умеет
-- только код iiko. Отсюда же и ноль внешних ключей на 192 таблицы: связывать
-- нечего, ссылки живут внутри блоба. Импортировав это, мы получили бы данные,
-- которые нельзя ни запросить, ни проверить.
--
-- Поэтому взяты не таблицы, а **механика**, проверенная у них годами:
--
--   * `revision`         — версия строки для обмена (у iiko на 126 таблицах из 192);
--   * `deleted`          — удаление флагом, не `DELETE`, иначе строка «воскреснет»
--                          при следующем обмене с другого узла;
--   * `last_modify_node` — кто последним менял строку (у iiko `lastModifyNode`);
--   * `deleted_entities` — надгробия (у iiko `DeletedEntity`);
--   * `replication_events` — исходящая очередь обмена (у iiko `ReplicationEvent`);
--   * `node_exchange_state` — докуда доехал каждый узел (у iiko `TerminalExchangeState`).
--
-- А вместо XML-блоба — обычные типизированные таблицы с внешними ключами.
-- Расширяемость при этом не теряется: её даёт `attributes JSONB` плюс реестр
-- `custom_field_defs` (см. раздел «Расширяемость»). Это строго лучше блоба:
-- по JSONB работают индексы и запросы, а по `ntext` с XML — нет.
--
-- МУЛЬТИТЕНАНТНОСТЬ
-- organizations → venues → (terminals|tables|menu_*|orders|...), при этом staff
-- и subscriptions висят на организации. Почти каждая выборка обязана
-- фильтроваться по venue_id — иначе утечка между арендаторами.
--
-- ВНЕШНИЕ КЛЮЧИ
-- На узле заведения они есть и ловят ошибки рано: писатель тут один и порядок
-- операций свой. В облаке пакеты синхронизации приезжают вперемешку, поэтому
-- приём делается через промежуточную таблицу, а не снятием ключей по всей схеме.

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ── Общие соглашения ────────────────────────────────────────────────────────
--
-- Синхронизируемая таблица несёт четыре служебные колонки. Вынесены в домен,
-- чтобы не повторять их описание у каждой таблицы:
--
--   revision          BIGINT  — растёт при каждой записи, по нему идёт обмен;
--   deleted           BOOL    — надгробие вместо физического удаления;
--   last_modify_node  UUID    — какой узел изменил последним;
--   attributes        JSONB   — пользовательские поля (см. «Расширяемость»).

CREATE DOMAIN money_amount AS NUMERIC(10,2);
CREATE DOMAIN qty AS NUMERIC(12,3);

-- Общий счётчик ревизий узла. Один на базу: обмен идёт «отдай всё, что больше
-- ревизии N», и для этого номера обязаны быть сравнимы между таблицами.
CREATE SEQUENCE IF NOT EXISTS revision_seq AS BIGINT START 1;

-- ── Организации, подписки, фичи ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,          -- 'start' | 'standard' | 'pro'
    name TEXT NOT NULL,
    price_monthly money_amount NOT NULL,
    -- Числовые ограничения — quota, а не feature-flag (инвариант №2):
    -- проверяются счётом текущего использования.
    max_terminals INT NOT NULL,
    max_venues INT NOT NULL,
    max_staff INT NOT NULL DEFAULT 1000
);

CREATE TABLE IF NOT EXISTS plan_features (
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_code TEXT NOT NULL,         -- 'warehouse', 'kds', 'egais', ...
    PRIMARY KEY (plan_id, feature_code)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    plan_id UUID NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL,               -- 'active' | 'past_due' | 'canceled'
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);

-- ── Заведения, терминалы, персонал ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    address TEXT,
    -- 'tables'  — зал со схемой столов;
    -- 'counter' — прилавок без столов (шаурмечная, кофейня навынос).
    -- Не выводится из тарифа: зала нет потому, что еду выдают в руки,
    -- а не потому, что за него не заплачено.
    service_mode TEXT NOT NULL DEFAULT 'tables'
        CHECK (service_mode IN ('tables', 'counter')),
    attributes JSONB NOT NULL DEFAULT '{}',
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_venues_org ON venues(organization_id);

CREATE TABLE IF NOT EXISTS terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    kind TEXT NOT NULL CHECK (kind IN ('pos', 'kds', 'admin')),
    label TEXT,
    -- Станция, которую обслуживает кухонный монитор. NULL у кассы и админки.
    prep_station_id UUID,
    -- Чековый принтер терминала. Это НЕ принтер станции: кухонные марки уходят
    -- в цеха, а чек и денежный ящик висят на кассе — ящик открывается командой
    -- своего же чекового принтера.
    receipt_printer_host TEXT,
    receipt_printer_port INT,

    /*
     * Фискальный регистратор.
     *
     * Живёт на терминале, а не на узле: ФР подключён к конкретной кассе
     * по COM-порту физически. Узлу он нужен по двум причинам — Z-отчёт должен
     * знать, на чём пробит, а вопрос «почему за смену нет фискальных
     * признаков» задают потом, когда касса уже выключена, и ответить на него
     * можно только из БД узла.
     */
    fiscal_model TEXT CHECK (fiscal_model IN ('atol', 'shtrih', 'virtual')),
    -- «COM3». У виртуального ФР порта нет.
    fiscal_port TEXT,
    fiscal_baud_rate INT,
    /*
     * Держит ли касса COM-порт прямо сейчас.
     *
     * Порт занимает ровно один процесс: пока его держит касса, утилита
     * производителя (ДТО Атол, тест Штрих-М) открыть его не сможет — а она
     * нужна для прошивки, фискализации и диагностики. Отсюда возможность
     * отпустить порт из сервисного режима.
     *
     * Состояние хранится, потому что забывается: отпустили под утилиту,
     * ушли, а обнаруживает это кассир, когда гость уже стоит с деньгами.
     */
    fiscal_is_connected BOOLEAN NOT NULL DEFAULT TRUE,
    fiscal_released_at TIMESTAMPTZ,
    -- Отпускает порт вендорский инженер, а он не сотрудник арендатора
    -- и в `staff` его нет. Ссылка на `service_accounts` навешивается ниже:
    -- та таблица объявлена после этой.
    fiscal_released_by UUID,

    attributes JSONB NOT NULL DEFAULT '{}',
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,

    -- У виртуального ФР порта не бывает: адрес, который никуда не ведёт,
    -- потом ищут часами.
    CONSTRAINT chk_virtual_fiscal_has_no_port
        CHECK (fiscal_model IS DISTINCT FROM 'virtual' OR fiscal_port IS NULL),
    -- Отпущенный порт обязан помнить, когда и кем: иначе «почему смена
    -- не фискализирована» остаётся без ответа.
    CONSTRAINT chk_released_port_has_trace
        CHECK (fiscal_is_connected OR fiscal_released_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_terminals_venue ON terminals(venue_id);
-- «Какие кассы сейчас без фискального регистратора» — вопрос дежурный,
-- и отвечать на него перебором всех терминалов не нужно.
CREATE INDEX IF NOT EXISTS idx_terminals_fiscal_released
    ON terminals(venue_id) WHERE NOT fiscal_is_connected;

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK (role IN ('waiter', 'cashier', 'manager', 'cook')),
    pin_code_hash TEXT NOT NULL,        -- на клиент не отдаётся никогда
    attributes JSONB NOT NULL DEFAULT '{}',
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_staff_org ON staff(organization_id);

-- Вендорский доступ живёт ОТДЕЛЬНО от staff арендатора: иначе тех. специалист
-- попадёт в квоту max_staff и будет виден менеджеру в списке персонала.
-- Роль `support` в staff.role поэтому и отсутствует (см. docs/access.md).
CREATE TABLE IF NOT EXISTS service_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    pin_code_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Отложенная ссылка: `terminals` объявлены выше, а отпускает COM-порт
-- фискального регистратора именно вендорский инженер.
ALTER TABLE terminals DROP CONSTRAINT IF EXISTS fk_terminals_fiscal_released_by;
ALTER TABLE terminals
    ADD CONSTRAINT fk_terminals_fiscal_released_by
    FOREIGN KEY (fiscal_released_by) REFERENCES service_accounts(id);

-- ── Смены: их ТРИ, и они независимы ─────────────────────────────────────────
--
-- Свести их в одну «смену» — потерять либо табель, либо фискальную отчётность:
--
--   shifts       — смена заведения (бизнес-день). По ней нумеруются заказы.
--   cash_shifts  — кассовая смена фискального регистратора. По ней нумеруются
--                  чеки и сводится Z-отчёт. Принадлежит ТЕРМИНАЛУ: у двух касс
--                  в одном зале свои ФР и своя нумерация.
--   staff_shifts — личная смена (явка) сотрудника. Из неё считается отработанное
--                  время и личные продажи.
--
-- Официант уходит домой, не закрывая кассовый день; кассовая смена закрывается
-- раз в сутки, пока через терминал прошло четверо.

CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    opened_by UUID REFERENCES staff(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq')
);
CREATE INDEX IF NOT EXISTS idx_shifts_venue ON shifts(venue_id);

CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    terminal_id UUID NOT NULL REFERENCES terminals(id),
    -- Сквозной номер по фискальному регистратору. Не переиспользуется:
    -- на него ссылается закрытый чек и по нему налоговая сводит Z-отчёты.
    number INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_by UUID NOT NULL REFERENCES staff(id),
    closed_by UUID REFERENCES staff(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ,
    opening_float money_amount NOT NULL DEFAULT 0,   -- разменный фонд
    client_id TEXT,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    last_modify_node UUID,
    UNIQUE (terminal_id, number)
);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_venue ON cash_shifts(venue_id);
-- Открытая смена на терминале ровно одна. Частичный уникальный индекс делает
-- это ограничением БД, а не договорённостью: две открытые смены с разными
-- номерами означают, что Z-отчёт свести уже нельзя.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_shifts_one_open
    ON cash_shifts(terminal_id) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS staff_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    staff_id UUID NOT NULL REFERENCES staff(id),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ,
    -- Зачтённое время против фактического. Расхождение и есть «серая зона»
    -- табеля: человек пробил приход за час до начала смены по расписанию.
    -- Правится только зачтённое — стерев факт, мы уничтожим само расхождение.
    accepted_at TIMESTAMPTZ,
    accepted_until TIMESTAMPTZ,
    approved_by UUID REFERENCES staff(id),
    client_id TEXT,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    last_modify_node UUID
);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_venue ON staff_shifts(venue_id);
-- У сотрудника не бывает двух открытых явок: иначе отработанное время
-- задвоится в расчёте по зарплате.
CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_shifts_one_open
    ON staff_shifts(staff_id) WHERE status = 'open';

-- Движения по денежному ящику. Отдельный класс: это не заказ и не платёж.
-- Размен утром и инкассация вечером не связаны ни с одним чеком, но обязаны
-- сходиться с наличностью — без них X-отчёт не бьётся, и непонятно, недостача
-- это или невнесённый размен.
--
-- Append-only и иммутабельно (инвариант №6): ошибочное изъятие исправляется
-- встречным внесением, а не правкой суммы.
CREATE TABLE IF NOT EXISTS cash_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_shift_id UUID NOT NULL REFERENCES cash_shifts(id),
    kind TEXT NOT NULL
        CHECK (kind IN ('deposit', 'withdrawal', 'opening_float', 'collection')),
    -- Всегда положительная: направление задаёт kind, а не знак суммы.
    amount money_amount NOT NULL CHECK (amount > 0),
    staff_id UUID NOT NULL REFERENCES staff(id),
    approved_by UUID REFERENCES staff(id),
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_id TEXT,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    last_modify_node UUID
);
CREATE INDEX IF NOT EXISTS idx_cash_operations_shift ON cash_operations(cash_shift_id);

-- ── Станции приготовления ───────────────────────────────────────────────────
-- Экран и принтер — два ВЫВОДА одной станции, а не два механизма. Разведя их,
-- получишь марку с тем, чего нет на экране (docs/kitchen.md).

CREATE TABLE IF NOT EXISTS prep_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    name TEXT NOT NULL,                 -- «Горячий цех», «Бар», «Пицца»
    sort_order INT NOT NULL DEFAULT 0,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_prep_stations_venue ON prep_stations(venue_id);

CREATE TABLE IF NOT EXISTS station_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES prep_stations(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('screen', 'printer')),
    name TEXT NOT NULL,
    host TEXT,                          -- у вывода типа screen — NULL
    port INT,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq')
);
CREATE INDEX IF NOT EXISTS idx_station_outputs_station ON station_outputs(station_id);

ALTER TABLE terminals
    DROP CONSTRAINT IF EXISTS fk_terminals_prep_station;
ALTER TABLE terminals
    ADD CONSTRAINT fk_terminals_prep_station
    FOREIGN KEY (prep_station_id) REFERENCES prep_stations(id);

-- Очередь печати. Не прямой вызов принтера: печать не должна блокировать
-- отправку заказа (инвариант №3), а упавшее задание обязано быть видимым
-- и повторяемым.
CREATE TABLE IF NOT EXISTS print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    output_id UUID NOT NULL REFERENCES station_outputs(id),
    station_id UUID NOT NULL REFERENCES prep_stations(id),
    order_id UUID NOT NULL,
    item_ids UUID[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'printing', 'printed', 'failed')),
    -- Повтор помечается на бумаге «КОПИЯ»: молчаливый дубль — второе блюдо.
    is_reprint BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INT NOT NULL DEFAULT 0,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status)
    WHERE status IN ('queued', 'failed');

-- ── Меню ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    attributes JSONB NOT NULL DEFAULT '{}',
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_menu_categories_venue ON menu_categories(venue_id);

CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES menu_categories(id),
    name TEXT NOT NULL,
    price money_amount NOT NULL,
    -- Куда уезжает на приготовление. Ссылка на справочник, а не перечисление
    -- 'kitchen'|'bar': у ресторана бывают холодный и горячий цеха, пицца, суши.
    prep_station_id UUID REFERENCES prep_stations(id),
    attributes JSONB NOT NULL DEFAULT '{}',
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

CREATE TABLE IF NOT EXISTS modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    name TEXT NOT NULL,
    price_delta money_amount NOT NULL DEFAULT 0,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Стоп-лист хранит ОСТАТОК, а не флаг «нет»: «осталось три порции» позволяет
-- дораспродать то, что есть, вместо снятия блюда с продажи целиком.
-- Живёт отдельной таблицей, а не колонкой в menu_items, потому что это факт
-- смены, а не свойство блюда: меню едет из облака, стоп-лист — местный.
CREATE TABLE IF NOT EXISTS stop_list (
    venue_id UUID NOT NULL REFERENCES venues(id),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    remainder qty NOT NULL DEFAULT 0 CHECK (remainder >= 0),
    staff_id UUID NOT NULL REFERENCES staff(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    PRIMARY KEY (venue_id, menu_item_id)
);

-- ── Столы и схема зала ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    label TEXT NOT NULL,
    -- Позиция в ДОЛЯХ холста (0..1), а не в пикселях: абсолютные координаты
    -- привязывают расстановку к разрешению терминала, на котором её рисовали,
    -- и на моноблоке 1024x768 часть столов уезжает за границу экрана.
    cx NUMERIC(6,5) NOT NULL DEFAULT 0.5 CHECK (cx BETWEEN 0 AND 1),
    cy NUMERIC(6,5) NOT NULL DEFAULT 0.5 CHECK (cy BETWEEN 0 AND 1),
    width INT NOT NULL DEFAULT 96,      -- размер — в пикселях
    height INT NOT NULL DEFAULT 96,
    shape TEXT NOT NULL DEFAULT 'rect' CHECK (shape IN ('rect', 'circle')),
    seats INT NOT NULL DEFAULT 4,
    attributes JSONB NOT NULL DEFAULT '{}',
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_tables_venue ON tables(venue_id);
-- Статуса стола здесь НЕТ намеренно: занятость вычисляется из активных заказов,
-- иначе один факт хранился бы в двух местах и разъезжался.

-- ── Заказы ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    table_id UUID REFERENCES tables(id),   -- NULL — прилавок или навынос
    shift_id UUID NOT NULL REFERENCES shifts(id),
    waiter_id UUID NOT NULL REFERENCES staff(id),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'sent_to_kitchen', 'paid', 'canceled')),
    -- Номер заказа в смене заведения: на прилавке его называют гостю.
    number INT NOT NULL,
    -- Сколько гостей за столом. Нужно и для деления счёта, и для отчётов:
    -- средний чек на гостя — не то же, что средний чек на заказ.
    guest_count INT NOT NULL DEFAULT 1 CHECK (guest_count >= 1),
    -- Проставляются при оплате и дальше неизменны: по паре «смена + чек»
    -- закрытый заказ ищут в реестре счетов и сверяют с Z-отчётом.
    cash_shift_number INT,
    receipt_number INT,
    -- Номер во внешней системе (агрегатор, сайт, приложение). Гость называет
    -- именно его, а не наш внутренний номер.
    external_number TEXT,
    -- Идемпотентность офлайн-создания: повтор с тем же client_id возвращает
    -- уже созданный заказ, а не дубль.
    client_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    attributes JSONB NOT NULL DEFAULT '{}',
    -- orders — last-write-wins (инвариант №6): заказ это состояние.
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    last_modify_node UUID,
    UNIQUE (shift_id, number)
);
CREATE INDEX IF NOT EXISTS idx_orders_venue ON orders(venue_id);
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders(venue_id, status)
    WHERE status IN ('open', 'sent_to_kitchen');
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_client_id
    ON orders(venue_id, client_id) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_receipt
    ON orders(venue_id, cash_shift_number, receipt_number)
    WHERE receipt_number IS NOT NULL;

-- order_items — APPEND-ONLY (инвариант №6): потерянная позиция это либо
-- несъеденное блюдо, либо неоплаченное. Отмена выражается статусом, не DELETE.
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    -- Дробное после деления блюда: «1 = 2 × 0,5».
    quantity qty NOT NULL DEFAULT 1 CHECK (quantity > 0),
    -- Цена снимком на момент добавления: подорожание меню не должно менять
    -- сумму уже открытого счёта.
    price money_amount NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'cooking', 'ready', 'served', 'voided', 'split')),
    -- Доля какой позиции. NULL — самостоятельная строка.
    -- Исходник помечается status='split' и выпадает из суммы: деньги несут
    -- его доли, и считать оба уровня значит взять с гостя дважды.
    split_of UUID REFERENCES order_items(id),
    -- Чей это заказ внутри компании. Номер, а не ссылка: гости стола безымянны.
    guest_number INT,
    client_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    last_modify_node UUID
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_kitchen ON order_items(status)
    WHERE status IN ('cooking', 'ready');

CREATE TABLE IF NOT EXISTS order_item_modifiers (
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    modifier_id UUID NOT NULL REFERENCES modifiers(id),
    PRIMARY KEY (order_item_id, modifier_id)
);

-- ── Оплата ──────────────────────────────────────────────────────────────────

-- Типы оплаты — справочник, а не перечисление: у сети бывают «Сбербанк»,
-- «Долями», «Сертификат», у столовой — «Питание персонала». Каждый новый тип
-- не должен означать пересборку кассы.
CREATE TABLE IF NOT EXISTS payment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    label TEXT NOT NULL,
    -- Род обработки. 'no_revenue' — НЕ скидка 100%: чек есть, блюда со склада
    -- списываются, выручки нет (питание персонала, представительские).
    kind TEXT NOT NULL
        CHECK (kind IN ('cash', 'card', 'external', 'no_revenue')),
    counts_as_revenue BOOLEAN NOT NULL DEFAULT TRUE,
    opens_drawer BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_payment_types_venue ON payment_types(venue_id);

-- Оплата — СПИСОК строк, а не одно поле: гость платит часть картой, часть
-- наличными, и каждая часть отдельный факт.
--
-- payments append-only и ИММУТАБЕЛЬНЫ (инвариант №6): LWW на платеже означает
-- потерянную выручку. Возврат — новая строка с refund_of, а не правка исходной.
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    -- Смена, в которую попал платёж. По ней сводится X- и Z-отчёт.
    cash_shift_id UUID NOT NULL REFERENCES cash_shifts(id),
    payment_type_id UUID NOT NULL REFERENCES payment_types(id),
    -- Род и название ПРОДУБЛИРОВАНЫ из справочника намеренно: закрытый чек —
    -- финансовый документ, и переименование типа оплаты через год не должно
    -- менять то, что напечатано в прошлогоднем Z-отчёте.
    kind TEXT NOT NULL,
    label TEXT NOT NULL,
    amount money_amount NOT NULL,
    tip_amount money_amount NOT NULL DEFAULT 0,
    -- Сколько дал гость. Нужно только для сдачи и только для наличных:
    -- у карты «принято» всегда равно сумме.
    tendered money_amount,
    staff_id UUID NOT NULL REFERENCES staff(id),
    -- Для возврата — ссылка на возвращаемый платёж.
    refund_of UUID REFERENCES payments(id),
    -- Результат эквайринга: у каждой карты в чеке свой код авторизации.
    auth_code TEXT,
    rrn TEXT,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_id TEXT,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    last_modify_node UUID
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_shift ON payments(cash_shift_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_client_id
    ON payments(client_id) WHERE client_id IS NOT NULL;
-- Возврат возврата — бессмыслица: встречная строка уже существует.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_one_refund
    ON payments(refund_of) WHERE refund_of IS NOT NULL;

-- ── Скидки и надбавки ───────────────────────────────────────────────────────
--
-- Надбавка — **отдельный род, а не отрицательная скидка**. Сведя их в одно
-- знаковое поле, мы сэкономили бы колонку и потеряли отчёт «036 Скидки
-- и надбавки»: скидка это потеря выручки, надбавка (обслуживание, доставка) —
-- её источник, и в сумме они могут дать ноль. Одной колонкой это выглядело бы
-- как «ничего не было».

CREATE TABLE IF NOT EXISTS discount_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    label TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('discount', 'surcharge')),
    mode TEXT NOT NULL CHECK (mode IN ('percent', 'amount')),
    -- Проценты (10 = 10%) либо сумма — по `mode`.
    value NUMERIC(10,2) NOT NULL CHECK (value >= 0),
    /*
     * Требует подтверждения чужим PIN. Право `order.discount` побиваемое,
     * и градация нужна: гостевые 5–10% кассир даёт сам, 30% на персонал —
     * с подтверждением. Иначе право либо блокирует обычную работу, либо
     * не защищает ни от чего.
     */
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_discount_types_venue ON discount_types(venue_id);

-- Применённая к заказу скидка.
--
-- `label`, `mode`, `value` и рассчитанный `amount` — снимки, по той же причине,
-- что у платежа: закрытый чек это финансовый документ, и правка справочника
-- через год не должна менять прошлогодний отчёт. Пересчитывать процент при
-- каждом показе тоже нельзя — состав чека мог измениться после применения.
CREATE TABLE IF NOT EXISTS order_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    -- NULL — скидка введена вручную, минуя справочник.
    discount_type_id UUID REFERENCES discount_types(id),
    kind TEXT NOT NULL CHECK (kind IN ('discount', 'surcharge')),
    mode TEXT NOT NULL CHECK (mode IN ('percent', 'amount')),
    label TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    amount money_amount NOT NULL CHECK (amount >= 0),
    -- Позиция, если скидка на одно блюдо. NULL — на весь заказ.
    order_item_id UUID REFERENCES order_items(id),
    staff_id UUID NOT NULL REFERENCES staff(id),
    -- Кто подтвердил, если скидка требовала подтверждения.
    approved_by UUID REFERENCES staff(id),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_id TEXT,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    last_modify_node UUID
);
CREATE INDEX IF NOT EXISTS idx_order_discounts_order ON order_discounts(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_discounts_client_id
    ON order_discounts(client_id) WHERE client_id IS NOT NULL;

-- ── Гости и доставка ────────────────────────────────────────────────────────

-- Постоянные гости. Не путать с гостями заказа: те безымянны и различаются
-- номером за столом (order_items.guest_number).
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    attributes JSONB NOT NULL DEFAULT '{}',   -- заготовка под лояльность
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_guests_venue ON guests(venue_id);
-- Телефон ищут обрывком («…3344»), поэтому индекс по цифрам без форматирования.
CREATE INDEX IF NOT EXISTS idx_guests_phone
    ON guests(venue_id, regexp_replace(phone, '\D', '', 'g'));

-- Доставка — НАДСТРОЙКА над заказом, а не его замена: позиции и деньги живут
-- в orders/order_items, здесь только то, что появляется, когда еда покидает
-- заведение. Статус доставки отделён от статуса заказа: заказ бывает paid,
-- пока доставка ещё on_way.
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    kind TEXT NOT NULL CHECK (kind IN ('delivery', 'pickup')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN
        ('unconfirmed', 'new', 'cooking', 'ready', 'on_way', 'closed', 'canceled')),
    -- У самовывоза адреса и курьера не бывает: его никто не везёт.
    address TEXT,
    courier_id UUID REFERENCES staff(id),
    guest_id UUID REFERENCES guests(id),
    customer_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    -- К какому времени ждут. Опоздание считается от него, а не от создания.
    due_at TIMESTAMPTZ NOT NULL,
    external_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_id TEXT,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    last_modify_node UUID,
    CONSTRAINT chk_pickup_has_no_courier
        CHECK (kind <> 'pickup' OR (courier_id IS NULL AND address IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_deliveries_venue_status
    ON deliveries(venue_id, status);

-- ── Журнал опасных операций ─────────────────────────────────────────────────
-- Механизм подтверждения чужим PIN существует РАДИ этого журнала: без него
-- подтвердили и забыли. Разбор недостачи в конце смены выглядит именно так.
--
-- Живёт на узле, а не на терминале: иначе достаточно очистить localStorage,
-- чтобы следы пропали.
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    permission TEXT NOT NULL,           -- 'order.item.void', 'payment.refund', ...
    subject TEXT,                       -- «Заказ № 12», «Стол 5»
    entity_id UUID,
    actor_id UUID NOT NULL REFERENCES staff(id),
    -- NULL — сотрудник выполнил действие своим правом, без подтверждения.
    approved_by UUID REFERENCES staff(id),
    terminal_id UUID REFERENCES terminals(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq')
);
CREATE INDEX IF NOT EXISTS idx_audit_log_venue ON audit_log(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_permission ON audit_log(venue_id, permission);

-- ── Склад (тариф Standard+) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouse_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    name TEXT NOT NULL,
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'l', 'pcs')),
    quantity qty NOT NULL DEFAULT 0,
    attributes JSONB NOT NULL DEFAULT '{}',
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_venue ON warehouse_items(venue_id);

CREATE TABLE IF NOT EXISTS menu_item_ingredients (
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    warehouse_item_id UUID NOT NULL REFERENCES warehouse_items(id),
    quantity_used qty NOT NULL,
    PRIMARY KEY (menu_item_id, warehouse_item_id)
);

-- Движения склада отдельной таблицей, а не правкой warehouse_items.quantity:
-- остаток без истории невозможно объяснить при инвентаризации.
CREATE TABLE IF NOT EXISTS warehouse_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_item_id UUID NOT NULL REFERENCES warehouse_items(id),
    kind TEXT NOT NULL
        CHECK (kind IN ('incoming', 'writeoff', 'sale', 'inventory', 'transfer')),
    delta qty NOT NULL,                 -- знак задаёт направление
    order_id UUID REFERENCES orders(id),-- для kind='sale'
    staff_id UUID REFERENCES staff(id),
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq')
);
CREATE INDEX IF NOT EXISTS idx_warehouse_movements_item
    ON warehouse_movements(warehouse_item_id, created_at DESC);

-- ── Синхронизация узла с облаком ────────────────────────────────────────────
-- Механика взята у iiko (см. шапку файла). Инвариант №0: источник истины —
-- БД локального узла, облако получает данные обменом.

-- Надгробия. У iiko это DeletedEntity. Нужны, потому что физически удалённая
-- строка приедет обратно с другого узла: тот про удаление не знает.
CREATE TABLE IF NOT EXISTS deleted_entities (
    id UUID PRIMARY KEY,
    table_name TEXT NOT NULL,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq')
);
CREATE INDEX IF NOT EXISTS idx_deleted_entities_revision ON deleted_entities(revision);

-- Исходящая очередь обмена (у iiko ReplicationEvent). Пишется триггером,
-- читается отправщиком: «отдай всё, что больше ревизии N».
CREATE TABLE IF NOT EXISTS replication_events (
    revision BIGINT PRIMARY KEY DEFAULT nextval('revision_seq'),
    table_name TEXT NOT NULL,
    row_id UUID NOT NULL,
    op TEXT NOT NULL CHECK (op IN ('upsert', 'delete')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Докуда доехал каждый участник обмена (у iiko TerminalExchangeState).
CREATE TABLE IF NOT EXISTS node_exchange_state (
    node_id UUID PRIMARY KEY,
    node_kind TEXT NOT NULL CHECK (node_kind IN ('cloud', 'terminal', 'node')),
    -- Ровно то, что показывает экран «Статус» iiko: «Ревизия синхр. с сервером».
    last_sent_revision BIGINT NOT NULL DEFAULT 0,
    last_ack_revision BIGINT NOT NULL DEFAULT 0,
    last_contact_at TIMESTAMPTZ,
    error_count INT NOT NULL DEFAULT 0
);

-- Приём пакетов из облака (справочники едут односторонне, инвариант №6).
-- Промежуточная таблица, а не прямая вставка: пакеты приезжают вперемешку,
-- и строка может сослаться на ещё не приехавшего родителя. Разбор идёт
-- отдельным шагом, когда пакет собран целиком.
CREATE TABLE IF NOT EXISTS inbound_staging (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    row_id UUID NOT NULL,
    payload JSONB NOT NULL,
    source_revision BIGINT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_at TIMESTAMPTZ,
    error TEXT
);
CREATE INDEX IF NOT EXISTS idx_inbound_staging_pending
    ON inbound_staging(received_at) WHERE applied_at IS NULL;

-- Версия схемы. У iiko это DBVersion + UpgradeScripts — без неё узел не знает,
-- какие миграции применены, и обновление в заведении без связи невозможно.
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Расширяемость ───────────────────────────────────────────────────────────
--
-- Два уровня, и этого достаточно, чтобы не упереться:
--
-- 1. `attributes JSONB` на ключевых таблицах — произвольные поля без миграции.
--    То же, что даёт iiko своим XML-блобом, но по JSONB работают индексы
--    и запросы. Индексировать конкретный ключ так:
--        CREATE INDEX ON orders ((attributes->>'loyalty_card'));
--
-- 2. Реестр `custom_field_defs` — описание того, что лежит в attributes:
--    подпись, тип, обязательность. Без него JSONB превращается в свалку,
--    где каждый интегратор кладёт своё под своим именем.

CREATE TABLE IF NOT EXISTS custom_field_defs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    -- К какой таблице относится: 'orders', 'guests', 'menu_items', ...
    entity_type TEXT NOT NULL,
    -- Ключ внутри attributes.
    field_key TEXT NOT NULL,
    label TEXT NOT NULL,
    data_type TEXT NOT NULL
        CHECK (data_type IN ('text', 'number', 'bool', 'date', 'enum')),
    -- Для data_type='enum' — допустимые значения.
    enum_values TEXT[],
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    revision BIGINT NOT NULL DEFAULT nextval('revision_seq'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (organization_id, entity_type, field_key)
);

-- ── Триггеры обмена ─────────────────────────────────────────────────────────
-- Ревизия проставляется БАЗОЙ, а не приложением: пропущенный `UPDATE ... SET
-- revision` в одном месте кода означает строку, которая никогда не уедет
-- в облако, и найти это по симптому «у одной кассы старая цена» очень дорого.

CREATE OR REPLACE FUNCTION bump_revision() RETURNS TRIGGER AS $$
BEGIN
    NEW.revision := nextval('revision_seq');
    INSERT INTO replication_events (revision, table_name, row_id, op)
    VALUES (NEW.revision, TG_TABLE_NAME, NEW.id,
            CASE WHEN to_jsonb(NEW) ? 'deleted' AND (to_jsonb(NEW)->>'deleted')::bool
                 THEN 'delete' ELSE 'upsert' END);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'venues', 'terminals', 'staff', 'prep_stations', 'station_outputs',
        'menu_categories', 'menu_items', 'modifiers', 'stop_list', 'tables',
        'orders', 'order_items', 'payments', 'payment_types',
        'discount_types', 'order_discounts',
        'cash_shifts', 'staff_shifts', 'cash_operations',
        'guests', 'deliveries', 'warehouse_items', 'warehouse_movements',
        'audit_log', 'custom_field_defs'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_revision ON %1$s', t);
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_revision BEFORE INSERT OR UPDATE ON %1$s
             FOR EACH ROW EXECUTE FUNCTION bump_revision()', t);
    END LOOP;
END $$;

-- ── Сид тарифов ─────────────────────────────────────────────────────────────
-- Start — базовый; Standard — +склад/KDS/отчёты/доставка;
-- Pro — +ЕГАИС/лояльность/аналитика/поставщики/мультиточка.

INSERT INTO plans (code, name, price_monthly, max_terminals, max_venues, max_staff) VALUES
    ('start',    'Start',    0,    2,  1,  3),
    ('standard', 'Standard', 2900, 5,  3,  25),
    ('pro',      'Pro',      6900, 50, 50, 1000)
ON CONFLICT (code) DO NOTHING;

INSERT INTO plan_features (plan_id, feature_code)
SELECT p.id, f.code
FROM plans p
JOIN (VALUES
    ('standard', 'warehouse'),
    ('standard', 'kds'),
    ('standard', 'reports'),
    ('standard', 'delivery'),
    ('pro', 'warehouse'),
    ('pro', 'kds'),
    ('pro', 'reports'),
    ('pro', 'delivery'),
    ('pro', 'egais'),
    ('pro', 'loyalty'),
    ('pro', 'analytics'),
    ('pro', 'suppliers'),
    ('pro', 'multi_venue')
) AS f(plan_code, code) ON f.plan_code = p.code
ON CONFLICT DO NOTHING;
