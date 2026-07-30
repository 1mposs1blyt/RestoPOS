# RestoPOS — кассовая система для общепита

Аналог iiko Front по функциональности, с модульной архитектурой и ограничением возможностей
по уровню подписки (тарифа). Цель — дать малому и среднему общепиту (кофейни, фудтраки,
небольшие кафе) полнофункциональную кассу дешевле, без переплаты за модули, которые им не нужны.

## Содержание

- [Стек технологий](#стек-технологий)
- [Общая архитектура](#общая-архитектура)
- [Модель тарифов и feature-flags](#модель-тарифов-и-feature-flags)
- [Схема базы данных](#схема-базы-данных)
- [Поток работы (workflow)](#поток-работы-workflow)
- [Real-time синхронизация](#real-time-синхронизация)
- [Офлайн-режим](#офлайн-режим)
- [Дорожная карта MVP](#дорожная-карта-mvp)

---

## Стек технологий

| Слой | Технология |
|---|---|
| Backend | Node.js + TypeScript, Fastify/Express |
| БД | PostgreSQL |
| Real-time | WebSocket (Socket.io) |
| Frontend (касса/зал) | React (планшет/браузер) |
| Frontend (кухня) | React, отдельный "вид" (KDS) |
| Мобильные приложения | React Native (доставка, курьер, владелец-аналитика) |
| Очереди/фоновые задачи | BullMQ + Redis |
| Кэш и сессии | Redis |

## Общая архитектура

```
                         ┌─────────────────────┐
                         │     PostgreSQL       │
                         │  (основная БД)       │
                         └──────────▲───────────┘
                                    │
                         ┌──────────┴───────────┐
                         │   Backend API (Node)  │
                         │  REST + WebSocket      │
                         │  Feature-gate middleware│
                         └──┬───────┬───────┬────┘
                            │       │       │
                  ┌─────────┘   ┌───┘    ┌──┘
                  │             │        │
           ┌──────▼─────┐ ┌────▼─────┐ ┌▼──────────┐
           │  Касса/Зал  │ │  Кухня    │ │  Админка    │
           │  (React)    │ │  (KDS)    │ │  владельца  │
           └─────────────┘ └───────────┘ └─────────────┘
```

Все терминалы (касса, кухня, админка) — тонкие клиенты одного и того же бэкенда.
Различие между ними — только в наборе экранов и WebSocket-топиках, на которые они подписаны.

## Модель тарифов и feature-flags

Тариф не определяет отдельную "сборку" приложения — код один, доступ проверяется на лету.

- **Backend**: middleware `requireFeature('warehouse')` на каждом защищённом эндпоинте —
  проверяет план организации перед выполнением запроса. Это критично: скрытие кнопки в UI
  не является защитой, обход через прямой запрос к API должен быть невозможен.
- **Frontend**: обёртка `<FeatureGate feature="analytics">` — рендерит либо функционал,
  либо блок апсейла ("доступно на тарифе Pro").
- **Лимиты** (не булевы фичи, а числа): количество точек, терминалов, сотрудников —
  считаются отдельно и проверяются как quota, а не feature flag.

Примерные уровни:

| Тариф | Модули |
|---|---|
| **Start** | Заказы, столы, меню, чеки, роли персонала |
| **Standard** | + склад и остатки, кухонный экран, простые отчёты, доставка |
| **Pro** | + ЕГАИС/Честный знак, программы лояльности, BI-аналитика, поставщики, мультиточка |

## Схема базы данных

### Организации, подписки, фичи

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,        -- 'start' | 'standard' | 'pro'
    name TEXT NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL,
    max_terminals INT NOT NULL,
    max_venues INT NOT NULL
);

CREATE TABLE plan_features (
    plan_id UUID REFERENCES plans(id),
    feature_code TEXT NOT NULL,       -- 'warehouse', 'egais', 'analytics', ...
    PRIMARY KEY (plan_id, feature_code)
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    plan_id UUID REFERENCES plans(id),
    status TEXT NOT NULL,             -- 'active' | 'past_due' | 'canceled'
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Заведения, терминалы, персонал

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    address TEXT
);

CREATE TABLE terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    kind TEXT NOT NULL,               -- 'pos' | 'kds' | 'admin'
    label TEXT
);

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,               -- 'waiter' | 'cashier' | 'manager' | 'cook'
    pin_code_hash TEXT NOT NULL       -- вход по pin на терминале
);

CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    opened_by UUID REFERENCES staff(id),
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ,
    cash_start NUMERIC(10,2),
    cash_end NUMERIC(10,2)
);
```

### Меню

```sql
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    name TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES menu_categories(id),
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    is_stop_listed BOOLEAN DEFAULT FALSE,
    prep_station TEXT                 -- 'kitchen' | 'bar' — куда уходит на экран
);

CREATE TABLE modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id),
    name TEXT NOT NULL,               -- 'без лука', 'доп. сыр'
    price_delta NUMERIC(10,2) DEFAULT 0
);
```

### Столы, заказы

```sql
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'free'  -- 'free' | 'occupied' | 'reserved'
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    table_id UUID REFERENCES tables(id),
    shift_id UUID REFERENCES shifts(id),
    waiter_id UUID REFERENCES staff(id),
    status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'sent_to_kitchen' | 'paid' | 'canceled'
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    menu_item_id UUID REFERENCES menu_items(id),
    quantity INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'new'   -- 'new' | 'cooking' | 'ready' | 'served'
);

CREATE TABLE order_item_modifiers (
    order_item_id UUID REFERENCES order_items(id),
    modifier_id UUID REFERENCES modifiers(id),
    PRIMARY KEY (order_item_id, modifier_id)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    method TEXT NOT NULL,             -- 'cash' | 'card'
    amount NUMERIC(10,2) NOT NULL,
    tip_amount NUMERIC(10,2) DEFAULT 0,
    paid_at TIMESTAMPTZ DEFAULT now()
);
```

### Склад (тариф Standard+)

```sql
CREATE TABLE warehouse_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,               -- 'kg', 'l', 'pcs'
    quantity NUMERIC(12,3) NOT NULL DEFAULT 0
);

CREATE TABLE menu_item_ingredients (
    menu_item_id UUID REFERENCES menu_items(id),
    warehouse_item_id UUID REFERENCES warehouse_items(id),
    quantity_used NUMERIC(12,3) NOT NULL,
    PRIMARY KEY (menu_item_id, warehouse_item_id)
);
```

## Поток работы (workflow)

1. **Официант** на планшете открывает стол → создаёт `order` → добавляет `order_items`
2. При отправке заказа статус меняется на `sent_to_kitchen`, событие летит по WebSocket
   на терминалы с `kind = 'kds'` этого заведения
3. **Кухня** видит новый тикет, меняет статус позиций (`cooking` → `ready`),
   изменение статуса летит обратно официанту (событие `order_item.status_changed`)
4. **Официант** отмечает `served`, при закрытии стола создаётся `payment`
5. При оплате: если тариф ≥ Standard, автоматически списываются `warehouse_items`
   через `menu_item_ingredients`
6. В конце дня менеджер закрывает `shift` → генерируется отчёт по кассе

## Real-time синхронизация

- WebSocket-комнаты по `venue_id` + `terminal.kind` — кухня не получает события зала и наоборот
- События именуются по паттерну `entity.action`: `order.created`, `order_item.status_changed`,
  `table.status_changed`
- Источник истины — всегда БД; WebSocket только уведомляет клиентов о необходимости
  перезапросить/обновить локальный стейт (не передаёт полный стейт заказа в событии,
  чтобы избежать рассинхронизации)

## Офлайн-режим

- Локальный стейт заказов кэшируется на терминале (IndexedDB/SQLite на планшете)
- При потере соединения касса продолжает принимать заказы локально с временным `client_id`
- При восстановлении связи — очередь несинхронизированных операций отправляется на бэкенд,
  сервер разрешает конфликты по времени создания (last-write-wins на уровне заказа,
  но append-only на уровне order_items, чтобы не терять позиции)

## Дорожная карта MVP

1. **v0.1** — тариф Start: заказы, столы, меню, оплата, роли, Z-отчёт
2. **v0.2** — тариф Standard: кухонный экран, склад со списанием, доставка
3. **v0.3** — биллинг: подписки, feature-flags, автоапгрейд/даунгрейд тарифа
4. **v1.0** — тариф Pro: ЕГАИС/Честный знак (требует отдельной сертификации),
   лояльность, мультиточка, BI-отчёты
