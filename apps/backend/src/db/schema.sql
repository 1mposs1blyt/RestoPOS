-- Каноническая схема RestoPOS. Дублирует DDL из README и служит источником для
-- будущих миграций. Применить: pnpm --filter @restopos/backend db:schema
--
-- Мультитенантность: organizations → venues → (terminals|tables|menu_*|orders|...),
-- при этом staff и subscriptions висят на организации. Почти каждая выборка
-- обязана фильтроваться по venue_id — иначе утечка между арендаторами.

-- ── Организации, подписки, фичи ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,          -- 'start' | 'standard' | 'pro'
    name TEXT NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL,
    max_terminals INT NOT NULL,         -- quota, не feature-flag
    max_venues INT NOT NULL             -- quota, не feature-flag
);

CREATE TABLE IF NOT EXISTS plan_features (
    plan_id UUID REFERENCES plans(id),
    feature_code TEXT NOT NULL,         -- 'warehouse', 'kds', 'egais', ...
    PRIMARY KEY (plan_id, feature_code)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    plan_id UUID REFERENCES plans(id),
    status TEXT NOT NULL,               -- 'active' | 'past_due' | 'canceled'
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);

-- ── Заведения, терминалы, персонал ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    address TEXT
);
CREATE INDEX IF NOT EXISTS idx_venues_org ON venues(organization_id);

CREATE TABLE IF NOT EXISTS terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    kind TEXT NOT NULL,                 -- 'pos' | 'kds' | 'admin'
    label TEXT
);
CREATE INDEX IF NOT EXISTS idx_terminals_venue ON terminals(venue_id);

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,                 -- 'waiter' | 'cashier' | 'manager' | 'cook'
    pin_code_hash TEXT NOT NULL         -- на клиент не отдаётся никогда
);
CREATE INDEX IF NOT EXISTS idx_staff_org ON staff(organization_id);

CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    opened_by UUID REFERENCES staff(id),
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ,
    cash_start NUMERIC(10,2),
    cash_end NUMERIC(10,2)
);
CREATE INDEX IF NOT EXISTS idx_shifts_venue ON shifts(venue_id);

-- ── Меню ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    name TEXT NOT NULL,
    sort_order INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_menu_categories_venue ON menu_categories(venue_id);

CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES menu_categories(id),
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    is_stop_listed BOOLEAN DEFAULT FALSE,
    prep_station TEXT                   -- 'kitchen' | 'bar'
);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

CREATE TABLE IF NOT EXISTS modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id),
    name TEXT NOT NULL,
    price_delta NUMERIC(10,2) DEFAULT 0
);

-- ── Столы, заказы ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'free' -- 'free' | 'occupied' | 'reserved'
);
CREATE INDEX IF NOT EXISTS idx_tables_venue ON tables(venue_id);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    table_id UUID REFERENCES tables(id),
    shift_id UUID REFERENCES shifts(id),
    waiter_id UUID REFERENCES staff(id),
    status TEXT NOT NULL DEFAULT 'open',-- 'open' | 'sent_to_kitchen' | 'paid' | 'canceled'
    -- Временный id офлайн-заказа: сервер сопоставляет очередь при синхронизации,
    -- чтобы повторная отправка не создала дубль (last-write-wins на orders).
    client_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_venue ON orders(venue_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_client_id
    ON orders(venue_id, client_id) WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    menu_item_id UUID REFERENCES menu_items(id),
    quantity INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'new'  -- 'new' | 'cooking' | 'ready' | 'served'
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_item_modifiers (
    order_item_id UUID REFERENCES order_items(id),
    modifier_id UUID REFERENCES modifiers(id),
    PRIMARY KEY (order_item_id, modifier_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    method TEXT NOT NULL,               -- 'cash' | 'card'
    amount NUMERIC(10,2) NOT NULL,
    tip_amount NUMERIC(10,2) DEFAULT 0,
    paid_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- ── Склад (тариф Standard+) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouse_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,                 -- 'kg' | 'l' | 'pcs'
    quantity NUMERIC(12,3) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_venue ON warehouse_items(venue_id);

CREATE TABLE IF NOT EXISTS menu_item_ingredients (
    menu_item_id UUID REFERENCES menu_items(id),
    warehouse_item_id UUID REFERENCES warehouse_items(id),
    quantity_used NUMERIC(12,3) NOT NULL,
    PRIMARY KEY (menu_item_id, warehouse_item_id)
);

-- ── Сид тарифов ─────────────────────────────────────────────────────────────
-- Уровни из README: Start — базовый; Standard — +склад/KDS/отчёты/доставка;
-- Pro — +ЕГАИС/лояльность/аналитика/поставщики/мультиточка.

INSERT INTO plans (code, name, price_monthly, max_terminals, max_venues) VALUES
    ('start',    'Start',    0,    2,  1),
    ('standard', 'Standard', 2900, 5,  3),
    ('pro',      'Pro',      6900, 50, 50)
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
