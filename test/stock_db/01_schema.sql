-- =====================================================================
--  Складской учёт для общепита: MVP-схема (PostgreSQL 13+)
--  Подсмотрено у iiko по смыслу, но устроено по-человечески:
--  справочники — нормальные таблицы, а не XML в одной таблице.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Пользователи (нужны, чтобы знать, кто создал/провёл документ)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    login       text NOT NULL UNIQUE,
    name        text NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 1. СПРАВОЧНИКИ
-- ---------------------------------------------------------------------

-- Единицы измерения: кг, л, шт, порц
CREATE TABLE units (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL UNIQUE,      -- "Литр"
    short_name  text NOT NULL              -- "л"
);

-- Группы номенклатуры (папки "Бар", "Кухня"), дерево через parent_id
CREATE TABLE product_groups (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   uuid REFERENCES product_groups(id),
    name        text NOT NULL,
    is_deleted  boolean NOT NULL DEFAULT false
);

-- Номенклатура: и ингредиенты, и блюда, и заготовки в одной таблице
CREATE TABLE products (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        uuid REFERENCES product_groups(id),
    article         text NOT NULL UNIQUE,           -- артикул "00005"
    name            text NOT NULL,
    type            text NOT NULL
                    CHECK (type IN ('goods', 'dish', 'prepared', 'service')),
                    -- goods = товар/ингредиент, dish = блюдо,
                    -- prepared = заготовка, service = услуга
    unit_id         uuid NOT NULL REFERENCES units(id),
    writeoff_method text NOT NULL DEFAULT 'ingredients'
                    CHECK (writeoff_method IN ('ingredients', 'self')),
                    -- ingredients = раскладывать по техкарте,
                    -- self = списывать само блюдо/товар
    sale_price      numeric(18,2),                  -- цена продажи гостю
    is_deleted      boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    revision        int NOT NULL DEFAULT 1          -- защита от одновременной правки
);

-- Склады: "Основной", "Бар", "Кухня"
CREATE TABLE stores (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL UNIQUE,
    is_deleted  boolean NOT NULL DEFAULT false
);

-- Поставщики
CREATE TABLE suppliers (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    inn         text,
    phone       text,
    is_deleted  boolean NOT NULL DEFAULT false
);

-- ---------------------------------------------------------------------
-- 2. ТЕХКАРТЫ (у iiko: AssemblyChart + AssemblyChartItem)
-- ---------------------------------------------------------------------

-- Версия техкарты блюда/заготовки с периодом действия
CREATE TABLE recipes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      uuid NOT NULL REFERENCES products(id),
    date_from       date NOT NULL,
    date_to         date,                           -- NULL = действует бессрочно
    portions        numeric(18,6) NOT NULL DEFAULT 1
                    CHECK (portions > 0),           -- норма закладки
    created_by      uuid REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    CHECK (date_to IS NULL OR date_to >= date_from)
);
-- Пересечение периодов одной техкарты проверяется в коде (или EXCLUDE-констрейнтом позже)
CREATE INDEX ix_recipes_product_dates ON recipes(product_id, date_from);

-- Ингредиенты техкарты. Всё в единицах ингредиента, на recipes.portions порций
CREATE TABLE recipe_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    line_no         int NOT NULL,
    ingredient_id   uuid NOT NULL REFERENCES products(id),
    gross           numeric(18,6) NOT NULL CHECK (gross > 0),   -- брутто: сколько уходит со склада
    cold_loss_pct   numeric(5,2) NOT NULL DEFAULT 0,            -- потери при холодной обработке
    hot_loss_pct    numeric(5,2) NOT NULL DEFAULT 0,            -- потери при горячей обработке
    -- нетто и выход считаются из брутто и потерь, хранить не обязательно
    UNIQUE (recipe_id, line_no)
);

-- ---------------------------------------------------------------------
-- 3. КАССОВЫЕ СМЕНЫ И НАСТРОЙКИ
-- ---------------------------------------------------------------------

CREATE TABLE cash_shifts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    number          int NOT NULL,
    business_date   date NOT NULL,      -- учётный день, которым пойдут продажи
    opened_at       timestamptz NOT NULL,
    closed_at       timestamptz,
    opened_by       uuid REFERENCES users(id),
    closed_by       uuid REFERENCES users(id)
);

-- Одна строка с настройками учёта (то, что ты видел в "Настройках учета")
CREATE TABLE accounting_settings (
    id                          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    period_closed_until         date,           -- всё, что <= этой даты, менять нельзя
    allow_negative_sales        boolean NOT NULL DEFAULT true,
    allow_negative_other        boolean NOT NULL DEFAULT false,
    business_day_start          time NOT NULL DEFAULT '06:00',
    cost_method                 text NOT NULL DEFAULT 'moving_average'
                                CHECK (cost_method IN ('moving_average'))
);
INSERT INTO accounting_settings (id) VALUES (1);

-- ---------------------------------------------------------------------
-- 4. ДОКУМЕНТЫ (у iiko — по паре таблиц на каждый тип, у нас одна пара)
-- ---------------------------------------------------------------------

CREATE TABLE documents (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type            text NOT NULL CHECK (type IN (
                        'incoming_invoice',   -- приходная накладная
                        'sales_act',          -- акт реализации
                        'writeoff_act',       -- акт списания
                        'transfer',           -- внутреннее перемещение
                        'inventory'           -- инвентаризация
                    )),
    number          text NOT NULL,
    doc_date        timestamptz NOT NULL,           -- дата документа (от неё зависит техкарта и закрытый период)
    status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'posted', 'deleted')),
    store_id        uuid REFERENCES stores(id),     -- склад (для перемещения — откуда)
    store_to_id     uuid REFERENCES stores(id),     -- только для перемещения — куда
    supplier_id     uuid REFERENCES suppliers(id),  -- только для прихода
    cash_shift_id   uuid REFERENCES cash_shifts(id),-- только для акта реализации
    writeoff_reason text,                           -- только для списания: порча, бой и т.п.
    is_automatic    boolean NOT NULL DEFAULT false, -- создан системой, а не руками
    comment         text,
    created_by      uuid REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_by      uuid REFERENCES users(id),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    posted_at       timestamptz,
    revision        int NOT NULL DEFAULT 1,
    UNIQUE (type, number),
    CHECK (type <> 'incoming_invoice' OR supplier_id IS NOT NULL),
    CHECK (type <> 'transfer' OR (store_to_id IS NOT NULL AND store_to_id <> store_id))
);
CREATE INDEX ix_documents_date ON documents(doc_date);

CREATE TABLE document_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    line_no         int NOT NULL,
    product_id      uuid NOT NULL REFERENCES products(id),
    quantity        numeric(18,6) NOT NULL,         -- для инвентаризации — фактическое количество
    price           numeric(18,6),                  -- закупочная (приход) или продажная (реализация)
    amount          numeric(18,2),                  -- сумма строки
    UNIQUE (document_id, line_no)
);

-- ---------------------------------------------------------------------
-- 5. ДВИЖЕНИЯ И ОСТАТКИ (у iiko: AccountingTransaction + ATransactionBalance)
-- ---------------------------------------------------------------------

-- Каждый проведённый документ порождает строки движений.
-- Остаток на любую дату = сумма движений до этой даты.
CREATE TABLE stock_movements (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id         uuid NOT NULL REFERENCES documents(id),
    document_item_id    uuid REFERENCES document_items(id),
    movement_date       timestamptz NOT NULL,       -- = documents.doc_date
    store_id            uuid NOT NULL REFERENCES stores(id),
    product_id          uuid NOT NULL REFERENCES products(id),
    quantity            numeric(18,6) NOT NULL,     -- + приход, − расход
    cost_amount         numeric(18,2) NOT NULL      -- себестоимость движения, со знаком
);
CREATE INDEX ix_movements_store_product_date ON stock_movements(store_id, product_id, movement_date);
CREATE INDEX ix_movements_document ON stock_movements(document_id);

-- Текущий остаток и средняя себестоимость: обновляется в той же транзакции,
-- что и проведение документа. Чтобы не суммировать всю историю на каждый запрос.
CREATE TABLE stock_balances (
    store_id        uuid NOT NULL REFERENCES stores(id),
    product_id      uuid NOT NULL REFERENCES products(id),
    quantity        numeric(18,6) NOT NULL DEFAULT 0,
    total_cost      numeric(18,2) NOT NULL DEFAULT 0,
    -- средняя цена = total_cost / quantity (когда quantity > 0)
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (store_id, product_id)
);
