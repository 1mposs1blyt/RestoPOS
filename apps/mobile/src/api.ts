import { ApiClient } from "@restopos/api-client";

/**
 * Клиент приложения официанта. Тип терминала — `pos`: официант работает
 * с залом и заказами, события кухни ему не адресованы.
 */
export const api = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  terminalKind: "pos",
  getToken: () => localStorage.getItem("restopos.token"),
  onUnauthorized: () => {
    localStorage.removeItem("restopos.token");
  },
});
