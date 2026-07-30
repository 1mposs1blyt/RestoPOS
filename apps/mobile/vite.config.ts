import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  // См. комментарий в apps/desktop/vite.config.ts.
  optimizeDeps: {
    exclude: [
      "@restopos/shared-types",
      "@restopos/api-client",
      "@restopos/ui-kit",
    ],
  },

  clearScreen: false,
  server: {
    // Порт отличается от desktop (1420), чтобы обе кассы поднимались
    // одновременно на одной машине разработчика.
    port: 1430,
    strictPort: true,
    // Для запуска на реальном устройстве Tauri подставляет TAURI_DEV_HOST —
    // телефон грузит фронтенд по сети, localhost ему не подходит.
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1431,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
