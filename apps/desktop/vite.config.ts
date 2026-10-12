import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
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

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
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
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
