# @restopos/backend

REST + WebSocket бэкенд RestoPOS. Тонкие клиенты (касса, KDS, админка) — это один
и тот же API, различие между ними только в наборе экранов и подписках.

Стек: **Fastify 5 + PostgreSQL (pg) + socket.io**, TypeScript, запуск через `tsx`
(отдельного шага сборки у базы нет, как и у остальных пакетов монорепо).

## Запуск

```bash
pnpm install                       # из корня монорепо

# поднять схему в PostgreSQL (нужен psql и пустая БД restopos)
createdb restopos
pnpm --filter @restopos/backend db:schema

# dev-сервер с автоперезапуском
cp apps/backend/.env.example apps/backend/.env
pnpm dev:backend                   # или: pnpm --filter @restopos/backend dev
```

Переменные окружения читаются из процесса; для локали удобно
`node --env-file=apps/backend/.env` — либо экспортировать вручную. Значения —
в [.env.example](.env.example).

## Структура

```
src/
├── index.ts              # точка входа: buildApp() + socket.io + listen
├── app.ts                # сборка Fastify: cors, error-handler, auth, роуты
├── config.ts             # конфиг из окружения
├── db/
│   ├── pool.ts           # пул pg + помощники query() / tx()
│   └── schema.sql        # каноническая схема (дублирует DDL из README) + сид тарифов
├── http/
│   ├── errors.ts         # ApiError + коды, согласованные с packages/api-client
│   ├── context.ts        # RequestContext (organizationId, venueId, role, ...)
│   └── auth.ts           # разбор контекста арендатора (сейчас dev-заглушка)
├── billing/
│   └── entitlements.ts   # requireFeature / requireRole / assertQuota
├── realtime/
│   ├── rooms.ts          # roomName — синхронно с api-client
│   ├── io.ts             # socket.io: subscribe/unsubscribe → join/leave комнаты
│   └── events.ts         # рассылка entity.action без состояния в payload
└── modules/
    ├── health.ts         # GET /health, /health/db (публичные)
    ├── orders.ts         # пример: venue-скоуп + роль + emit order.created
    └── warehouse.ts      # пример: эндпоинт под requireFeature('warehouse')
```

## Как база отражает инварианты

Эти решения — из корневого `CLAUDE.md`, база их уже кодирует, а не «предлагает»:

1. **Тариф на бэкенде всегда.** `requireFeature('warehouse')` как `preHandler`
   (`billing/entitlements.ts`). Отказ — `403 { code: "feature_not_available" }`,
   ровно тот код, что уже различает `ApiError.isFeatureLocked` на клиенте.
2. **Фичи и лимиты — разное.** Булевы модули — в `plan_features`; числовые лимиты —
   `assertQuota()` со счётом текущего использования, не feature-flag. Отказ —
   `403 { code: "quota_exceeded" }`.
3. **WebSocket не переносит состояние.** `realtime/events.ts` кладёт в payload
   только идентификаторы; клиент по сигналу перезапрашивает данные. Источник
   истины — БД.
4. **Изоляция комнат.** `roomName(venueId, kind)` = `venue:{id}:{kind}` — та же
   функция, что в `api-client`. Кухня не получает события зала.
5. **Мультитенантность.** `RequestContext.venueId` навешивается в `onRequest`,
   каждая выборка фильтруется по нему; несовпадение venueId в пути и контексте —
   `403`, а не тихая выдача чужих данных.
6. **Роль и тариф независимы.** `requireRole(...)` и `requireFeature(...)` —
   отдельные проверки, обе обязательны.

## Что это ещё не делает (осознанно, база)

- **Аутентификация** — заглушка. `http/auth.ts` при `AUTH_DEV_BYPASS=1` берёт
  контекст из заголовков `x-org-id` / `x-venue-id` / `x-terminal-kind` /
  `x-staff-id` / `x-staff-role`. Реальный вход по PIN и токены смены — TODO.
- **Миграции** — только `schema.sql` целиком; инструмента миграций пока нет.
- **BullMQ + Redis** (очереди/фон из README) — не подключены.
- **Списание склада при оплате** — эндпоинта оплаты ещё нет; когда появится,
  списание идёт одной транзакцией с payment и только при тарифе ≥ Standard.
- **Тесты и линтер** — их в монорепо пока нет; не выдумывать команды.

## Проверка dev-режима

С `AUTH_DEV_BYPASS=1` и поднятой схемой (в БД есть организация/точка/подписка):

```bash
curl localhost:3000/health

curl localhost:3000/venues/<venueId>/orders \
  -H "x-org-id: <orgId>" -H "x-venue-id: <venueId>"

# без активной подписки со складом → 403 feature_not_available
curl localhost:3000/venues/<venueId>/warehouse/items \
  -H "x-org-id: <orgId>" -H "x-venue-id: <venueId>"
```
