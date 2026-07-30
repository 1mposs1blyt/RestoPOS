# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Статус репозитория

Развёрнут каркас монорепо (pnpm workspaces): в `apps/` — два Tauri v2 + React
фронтенда (`desktop`, `mobile`) и бэкенд (`backend`), в `packages/` — три пакета.
Фронтенды пока работают на локальных заглушках (`DEMO_TABLES`, `DEMO_ORDERS`) —
к `backend` они ещё не подключены. Бэкенд — база: Fastify + PostgreSQL + socket.io,
эндпоинты-примеры (`orders`, `warehouse`, `health`), аутентификация — dev-заглушка
(см. `apps/backend/README.md`). Тестов и линтера нет: **не выдумывай команды**
(`pnpm test`, `pnpm lint`) — их нужно сначала завести.

```bash
pnpm install
pnpm typecheck          # tsc --noEmit по всем проектам (включая backend)
pnpm build:web          # vite build обоих фронтендов
pnpm dev:backend        # tsx watch — REST+WS на :3000
pnpm dev:desktop        # tauri dev
pnpm --filter @restopos/desktop dev   # только фронтенд, без Tauri-обвязки
```

### Окружение этой машины

Отличается от того, где каркас разворачивался изначально (Windows без Rust), —
`apps/mobile/MOBILE_TARGETS.md` в этой части устарел (пути `C:\...`, PowerShell,
«Rust не установлен»). Фактически:

- ОС — **Linux (Asahi Fedora) на aarch64** (Apple Silicon под Linux, не macOS).
- `pnpm` **не в PATH**: поднимается через corepack — `corepack pnpm <cmd>`
  (даёт `pnpm@10.33.0` из `packageManager`); разово можно `corepack enable`.
- **Rust установлен** (1.95): команды `tauri` рабочие, desktop собирается нативно,
  Linux-зависимости Tauri (`webkit2gtk-4.1`) на месте.
- Android SDK стоит (`ANDROID_HOME`), но `apps/mobile/src-tauri/gen/{android,apple}`
  ещё не сгенерированы — их создаёт `tauri android init` (шаги в `MOBILE_TARGETS.md`
  верны по сути, переменные окружения выставлять по-линуксовому).
- **iOS по-прежнему невозможен**: нужен macOS с Xcode; на Linux подкоманды `ios`
  в CLI нет.

Документация проекта ведётся на русском — придерживайся этого языка в README, комментариях
и сообщениях коммитов.

## Устройство монорепо

Пакеты `@restopos/{shared-types,api-client,ui-kit}` экспортируют **исходники**
(`exports` → `src/index.ts`), шага сборки у них нет. Из этого следуют две неочевидные
привязки, которые легко сломать:

- новый воркспейс-пакет надо добавить в `optimizeDeps.exclude` в `vite.config.ts`
  обоих приложений, иначе Vite пре-бандлит его и HMR перестаёт видеть правки;
- Tailwind v4 сканирует классы по путям из `@source` в `src/index.css`. Классы,
  добавленные в новый пакет вне `packages/ui-kit/src`, в CSS не попадут,
  пока туда не добавлена соответствующая строка `@source`.

Path-алиасы живут в `tsconfig.base.json`, от которого наследуются все проекты.

Порты dev-серверов разведены намеренно: desktop 1420, mobile 1430 (HMR 1431) —
чтобы обе кассы поднимались одновременно. Они продублированы в `devUrl`
внутри `src-tauri/tauri.conf.json`, менять надо в обоих местах.

### Бэкенд (`apps/backend`)

Fastify + `pg` + socket.io, запуск через `tsx` (шага сборки нет, как у пакетов).
Отдельный от фронтендов tsconfig: `lib` без DOM, `types: ["node"]` — не наследуй
браузерный `lib` из base напрямую. Зависит от `@restopos/shared-types` (типы домена,
`EVENT_TOPICS`), но **не** от `api-client` (тот тянет axios/браузер). Из-за этого два
контракта продублированы и обязаны совпадать с клиентом руками:

- `roomName(venueId, kind)` в `realtime/rooms.ts` — байт-в-байт как в
  `packages/api-client/src/types.ts`, иначе подписки клиента промахиваются мимо комнат;
- коды ошибок 403 (`feature_not_available`, `quota_exceeded`) в `http/errors.ts` —
  ровно те, что различает `ApiError.isFeatureLocked` / `isQuotaExceeded` на клиенте.

`src/db/schema.sql` — каноническая схема (дублирует DDL из `README.md`) плюс сид
тарифов; инструмента миграций пока нет. Аутентификация — заглушка (`AUTH_DEV_BYPASS`,
контекст из заголовков `x-org-id`/`x-venue-id`/…). Подробности — в `apps/backend/README.md`.

## Что это

Кассовая система для общепита (аналог iiko Front). Ключевая продуктовая идея: **один код,
одна сборка**, а объём функционала определяется тарифом организации на лету. Полное описание
архитектуры, схема БД и дорожная карта — в `README.md`; ниже только то, что определяет
принимаемые в коде решения.

Стек по README: Node.js + TypeScript (Fastify), PostgreSQL, Socket.io, React везде —
и на кассе/зале с KDS, и в мобильном приложении официанта (оба клиента на Tauri v2,
не React Native), плюс BullMQ + Redis для очередей.

## Архитектурные инварианты

Это не рекомендации, а решения, из которых вытекает остальной дизайн. Нарушение любого
из них ломает модель продукта.

1. **Тариф проверяется на бэкенде, всегда.** `requireFeature('warehouse')` — middleware на
   каждом защищённом эндпоинте. `<FeatureGate feature="...">` во фронте — это UX (апсейл),
   а не защита: прямой запрос к API в обход UI должен получать отказ.
2. **Фичи и лимиты — разные механизмы.** Булевы модули живут в `plan_features`
   (`warehouse`, `egais`, `analytics`, …). Числовые ограничения (`max_terminals`,
   `max_venues`, число сотрудников) — это quota-проверки со счётом текущего использования,
   их нельзя реализовывать через feature-flag.
3. **WebSocket не переносит состояние.** Источник истины — только БД. События вида
   `entity.action` (`order.created`, `order_item.status_changed`, `table.status_changed`)
   лишь сигнализируют клиенту перезапросить данные. Класть полный заказ в payload события
   нельзя — это прямой путь к рассинхрону между залом и кухней.
4. **Изоляция комнат.** Подписка = `venue_id` + `terminal.kind` (`pos` | `kds` | `admin`).
   Кухня не должна получать события зала и наоборот.
5. **Все терминалы — тонкие клиенты одного бэкенда.** Касса, KDS и админка различаются
   набором экранов и подписками, а не отдельными API или сборками.
6. **Разрешение офлайн-конфликтов асимметрично:** last-write-wins на уровне `orders`,
   но append-only на уровне `order_items` — позиции заказа терять нельзя. Офлайн-заказы
   создаются с временным `client_id`, который сервер сопоставляет при синхронизации.

## Мультитенантность

Иерархия: `organizations` → `venues` → `terminals`/`tables`/`menu_*`, при этом `staff`
и `subscriptions` висят на организации, а не на заведении. Практически каждый запрос данных
должен быть ограничен по `venue_id` (а через него — по организации); отсутствие такого
фильтра — это утечка данных между арендаторами, а не просто баг выборки.

Аутентификация персонала на терминале — по PIN (`staff.pin_code_hash`), роли:
`waiter` | `cashier` | `manager` | `cook`. Роль (что человеку можно) и тариф (что оплачено
организацией) — независимые проверки, обе обязательны.

## Порядок реализации

Дорожная карта из README задаёт последовательность, и она не произвольная: биллинг
и feature-flags (v0.3) появляются **после** работающих модулей Start (v0.1) и Standard (v0.2).
Пока подписок нет, `requireFeature` всё равно должен стоять на эндпоинтах — иначе его
придётся дописывать задним числом по всему API.

Списание склада (`warehouse_items` через `menu_item_ingredients`) происходит в момент оплаты
и только при тарифе ≥ Standard.
