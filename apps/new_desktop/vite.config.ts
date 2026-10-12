import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// vite.config.ts проверяется tsconfig.node.json с types: ["node"],
// поэтому process здесь типизирован и подавлять ошибку не нужно.
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Воркспейс-пакеты отдаются как исходники (exports → src/index.ts).
  // Исключаем их из pre-bundle, иначе правки в packages/* не подхватываются HMR.
  optimizeDeps: {
    exclude: [
      "@restopos/shared-types",
      "@restopos/api-client",
      "@restopos/ui-kit",
    ],
  },

  // Переменные окружения, видимые фронту: свои VITE_* и те, что Tauri
  // подставляет сам (TAURI_ENV_PLATFORM, TAURI_ENV_ARCH и прочие).
  envPrefix: ["VITE_", "TAURI_ENV_"],

  // Не затирать ошибки сборки Rust выводом Vite.
  clearScreen: false,

  server: {
    // Порт фиксирован: CORS узла открыт ровно на localhost:1420,
    // и `tauri dev` ждёт фронт именно здесь.
    port: 1420,
    strictPort: true,
    // `false` у Vite означает «слушать localhost», а Node резолвит его
    // в ::1 и биндится только туда. IPv4-петлю задаём явно.
    host: host || "127.0.0.1",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // За src-tauri следит cargo, а не Vite.
      ignored: ["**/src-tauri/**"],
    },
  },
});
