import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Тесты для всего монорепо одной конфигурацией.
 *
 * Алиасы продублированы из `tsconfig.base.json`: пакеты экспортируют исходники
 * без шага сборки, и без алиасов Vitest не найдёт `@restopos/*`.
 *
 * Окружение — `node`, а не `jsdom`: под тестами чистая логика (редьюсеры,
 * деньги, миграции, выдача маршрутов), рендер им не нужен. Когда понадобятся
 * тесты на компоненты, окружение задаётся в них построчной директивой,
 * а не переключается глобально — иначе быстрые тесты платят за медленные.
 */
const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@restopos/shared-types": resolvePath(
        "./packages/shared-types/src/index.ts",
      ),
      "@restopos/api-client": resolvePath("./packages/api-client/src/index.ts"),
      "@restopos/ui-kit": resolvePath("./packages/ui-kit/src/index.ts"),
    },
  },
  test: {
    include: ["{apps,packages}/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
