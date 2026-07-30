import { ApiClient } from "@restopos/api-client";

/**
 * Единый клиент кассового терминала.
 *
 * Соединение не поднимается на старте: сначала терминал должен пройти
 * авторизацию по PIN и получить venueId текущей смены, только потом
 * вызывается `api.connect(venueId)`.
 */
export const api = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  terminalKind: "pos",
  getToken: () => localStorage.getItem("restopos.token"),
  onUnauthorized: () => {
    localStorage.removeItem("restopos.token");
  },
});
