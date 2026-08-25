/**
 * Замер экрана кассы на целевом железе: цели касания и то, что не влезло.
 *
 * Проверять раскладку на глаз по скриншоту нельзя — клавиатура в 140px вместо
 * 288 выглядит нормальной, — поэтому меряем getBoundingClientRect в настоящем
 * браузере: поднимаем Chrome в headless по CDP, проходим экран кликами
 * и обходим DOM.
 *
 * Что считается нарушением:
 *  - интерактивный элемент меньше 44px по любой стороне (моноблок, CLAUDE.md);
 *  - элемент, обрезанный ближайшим предком с overflow hidden: до него не
 *    добраться вовсе. Лежащее в прокручиваемой панели нарушением не считается —
 *    кассир его достанет;
 *  - горизонтальная прокрутка внутри экрана.
 *
 * Нужен поднятый дев-сервер кассы (pnpm --filter @restopos/desktop dev) и вход
 * по PIN 3333: менеджер есть и в демо-данных, и в сиде БД узла. В гейт
 * pnpm verify не входит — живой браузер и живой сервер там ни к чему.
 *
 *   node tools/measure-screen.mjs payment 1024x768,1366x768
 *
 * Адрес дев-сервера переопределяется `APP_URL` — потоку `kitchen` нужен
 * сервер без `VITE_NODE_URL` (почему — в комментарии к потоку).
 *
 * Новый экран — новый поток в flows: дойти до него кликами и позвать report
 * в каждом состоянии, которое стоит померить.
 */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const APP = process.env.APP_URL ?? "http://localhost:1420/";
const screen = process.argv[2] ?? "payment";
const sizes = (process.argv[3] ?? "1024x768,1366x768")
  .split(",")
  .map((s) => s.split("x").map(Number));

const profile = mkdtempSync(join(tmpdir(), "cdp-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "about:blank",
]);
chrome.stderr.on("data", () => {});

async function waitPort() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return await r.json();
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Chrome не поднялся");
}

class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      const slot = this.pending.get(msg.id);
      if (!slot) return;
      this.pending.delete(msg.id);
      msg.error ? slot.reject(new Error(JSON.stringify(msg.error))) : slot.resolve(msg.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(fn, ...args) {
    const expression = `(${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(",")})`;
    const res = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails)
      throw new Error(res.exceptionDetails.exception?.description ?? "ошибка в странице");
    return res.result.value;
  }
}

const helpers = () => {
  window.__sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__all = () => [...document.querySelectorAll("button, [role=button], a")];
  window.__find = (text, nth = 0) =>
    window.__all().filter((el) => (el.textContent ?? "").trim().includes(text))[nth] ?? null;
  window.__click = async (text, nth = 0) => {
    const el = window.__find(text, nth);
    if (!el) throw new Error(`не нашёл кнопку «${text}»`);
    el.click();
    await window.__sleep(400);
    return true;
  };
  /*
   * Одна и та же надпись живёт на экране, в переключателе экранов сверху
   * и в дев-панели снизу: «Прилавок» находится трижды, и какой из них
   * попадётся по номеру — зависит от того, сколько экранов доступно роли.
   * Поэтому ищем в конкретной области, а не по всей странице.
   */
  window.__within = async (root, text, nth = 0) => {
    if (!root) throw new Error(`нет области для кнопки «${text}»`);
    const el =
      [...root.querySelectorAll("button, [role=button], a")].filter((node) =>
        (node.textContent ?? "").trim().includes(text),
      )[nth] ?? null;
    if (!el) throw new Error(`не нашёл кнопку «${text}»`);
    el.click();
    await window.__sleep(400);
    return true;
  };
  /** Кнопка самого экрана. */
  window.__clickMain = (text, nth = 0) =>
    window.__within(document.querySelector("main"), text, nth);
  /** Кнопка дев-панели: она последняя в оболочке и в релиз не попадает. */
  window.__clickDev = (text, nth = 0) =>
    window.__within(
      document.querySelector("main")?.parentElement?.lastElementChild,
      text,
      nth,
    );
  return true;
};

const measure = () => {
  // Меряем экран, а не оболочку: дев-панель внизу в релиз не попадает.
  const root = document.querySelector("main") ?? document.body;
  const box = root.getBoundingClientRect();
  const small = [];
  const wide = [];
  const cut = [];
  // Текст мельче этого внутри тикета кухни с двух метров не читается
  // (см. расчёт в шапке `screens/kitchenscreen.tsx`). Тикет опознаётся
  // по тегу `article`; на других экранах его нет, и проверка молчит.
  const tiny = [];
  for (const el of root.querySelectorAll("*")) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const cls = typeof el.className === "string" ? el.className : "";
    const clickable =
      ["button", "a", "input", "select", "textarea"].includes(tag) ||
      el.getAttribute("role") === "button";
    if (clickable && r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44))
      small.push({
        text: (el.textContent ?? "").trim().slice(0, 24),
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
        cls: cls.slice(0, 90),
      });
    if (el.scrollWidth - el.clientWidth > 1)
      wide.push({ tag, cls: cls.slice(0, 90), scrollW: el.scrollWidth, clientW: el.clientWidth });
    // Элемент считаем потерянным, только если его режет ближайший предок
    // с overflow hidden: то, что лежит в прокручиваемой панели, кассир достанет.
    let clip = null;
    let fixed = style.position === "fixed";
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.position === "fixed") { fixed = true; break; }
      if (!clip && (ps.overflowX !== "visible" || ps.overflowY !== "visible")) clip = { el: p, style: ps };
    }
    const clipsHard = clip && ["hidden", "clip"].includes(clip.style.overflowY) && ["hidden", "clip"].includes(clip.style.overflowX);
    const bound = clip ? clip.el.getBoundingClientRect() : box;
    if (!fixed && clipsHard && r.width > 0 && r.height > 0 &&
        (r.right > bound.right + 1 || r.left < bound.left - 1 || r.bottom > bound.bottom + 1))
      cut.push({ tag, cls: cls.slice(0, 90), left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom), box: Math.round(bound.bottom) });
  }
  for (const el of root.querySelectorAll("article *")) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    // Меряем того, кто несёт текст сам, а не обёртки вокруг него.
    const owns = [...el.childNodes].some(
      (node) => node.nodeType === 3 && (node.textContent ?? "").trim() !== "",
    );
    if (!owns) continue;
    const size = Number.parseFloat(style.fontSize);
    if (size < 24)
      tiny.push({
        text: (el.textContent ?? "").trim().slice(0, 24),
        size,
        cls: (typeof el.className === "string" ? el.className : "").slice(0, 90),
      });
  }

  return {
    small,
    wide,
    tiny,
    cut: cut.slice(0, 10),
    rootW: Math.round(box.width),
    rootScrollW: root.scrollWidth,
    buttons: [...root.querySelectorAll("button")]
      .map((b) => (b.textContent ?? "").trim().slice(0, 18))
      .join(" | ")
      .slice(0, 400),
  };
};

async function report(s, name) {
  await s.eval(helpers);
  const r = await s.eval(measure);
  const ok =
    r.small.length === 0 &&
    r.cut.length === 0 &&
    r.wide.length === 0 &&
    r.tiny.length === 0;
  console.log(`  [${ok ? "ok" : "!!"}] ${name}: ширина ${r.rootW}, scrollWidth ${r.rootScrollW}`);
  for (const i of r.small) console.log(`      мелкая цель ${i.w}x${i.h} «${i.text}» | ${i.cls}`);
  for (const i of r.tiny)
    console.log(`      мелкий кегль в тикете ${i.size}px «${i.text}» | ${i.cls}`);
  for (const i of r.cut) console.log(`      вылезло ${i.tag} x ${i.left}..${i.right}, низ ${i.bottom} при ${i.box} | ${i.cls}`);
  for (const i of r.wide)
    console.log(`      скролл по горизонтали ${i.tag} ${i.scrollW}/${i.clientW} | ${i.cls}`);
  if (process.env.VERBOSE) console.log("      кнопки:", r.buttons);
  return ok;
}

/**
 * Открыть приложение заново и войти менеджером.
 *
 * Ждём появления клавиатуры PIN, а не фиксированную паузу: на холодном
 * дев-сервере Vite собирает модули по первому запросу, и полутора секунд
 * ему не хватает — поток падал на «не нашёл кнопку 3» ровно один раз,
 * на первом запуске после старта сервера.
 */
async function reopen(s) {
  // Перезагружаем командой отладчика, а не `location.reload()` изнутри
  // страницы: уходящая страница уносит с собой ответ на сам вызов
  // («Inspected target navigated or closed»).
  await s.send("Page.navigate", { url: APP });
  for (let i = 0; i < 60; i += 1) {
    await s.eval(() => new Promise((r) => setTimeout(r, 500)));
    await s.eval(helpers);
    if (await s.eval(() => window.__find("3") !== null)) break;
  }
  for (let i = 0; i < 4; i += 1) await s.eval((d) => window.__click(d), "3"); // PIN 3333
  await s.eval(() => window.__sleep(1500));
}

const flows = {
  payment: async (s) => {
    for (let i = 0; i < 4; i += 1) await s.eval((d) => window.__click(d), "3"); // PIN 3333
    await s.eval(() => window.__sleep(1500));
    // Режим заведения переключаем дев-панелью, экран открываем сверху:
    // по номеру среди всех кнопок «Прилавок» находится то одна, то две —
    // зависит от того, подключён ли дев-сервер к узлу (там заведение уже
    // прилавочное), и поток падал на пустом месте.
    await s.eval((t) => window.__clickDev(t), "Прилавок");
    await s.eval(() => window.__sleep(500));
    await s.eval((t) => window.__clickMain(t), "Прилавок");
    await s.eval(() => window.__sleep(500));
    // Три позиции в чеке, одна с длинным названием — чтобы строки были не пустые.
    await s.eval(() => {
      const tiles = [...document.querySelectorAll("button")].filter((el) =>
        el.className.includes("h-24"),
      );
      if (tiles.length === 0) throw new Error("не нашёл плитку меню");
      for (const tile of tiles.slice(0, 3)) tile.click();
      return true;
    });
    await s.eval(() => window.__sleep(400));
    await s.eval((t) => window.__click(t), "К оплате");
    await s.eval(() => window.__sleep(700));
    let ok = await report(s, "оплата, чек набран");
    await s.eval((t) => window.__click(t), "Скидка");
    ok = (await report(s, "диалог скидки")) && ok;
    // Берём скидку без подтверждения: диалог чужого PIN — не этот экран.
    await s.eval(() => {
      const el = [...document.querySelectorAll('button')].find(
        (b) => b.className.includes('min-h-16') && !b.textContent.includes('подтверждением') && b.closest('.fixed'),
      );
      if (!el) throw new Error('не нашёл скидку без подтверждения');
      el.click();
      return true;
    });
    await s.eval(() => window.__sleep(500));
    await s.eval((t) => window.__click(t), "Наличные");
    await s.eval((t) => window.__click(t), "+1000");
    ok = (await report(s, "скидка и строка оплаты наличными")) && ok;
    return ok;
  },

  cash: async (s) => {
    // Кассовая смена переживает перезагрузку (localStorage), а мерить надо оба
    // состояния экрана. Без чистки второй проход по разрешениям начинается
    // с уже открытой смены и не находит кнопку «Открыть смену».
    await s.eval(() => {
      for (const key of Object.keys(localStorage))
        if (key.startsWith("restopos.")) localStorage.removeItem(key);
      location.reload();
      return true;
    });
    await s.eval(() => new Promise((r) => setTimeout(r, 1600)));
    await s.eval(helpers);
    for (let i = 0; i < 4; i += 1) await s.eval((d) => window.__click(d), "3"); // PIN 3333
    await s.eval(() => window.__sleep(1500));
    await s.eval((t) => window.__click(t), "Кассовая смена");
    await s.eval(() => window.__sleep(500));
    // Профиль Chrome каждый раз новый, localStorage пуст — смена закрыта,
    // и первым меряется именно это состояние.
    let ok = await report(s, "касса, смена закрыта");
    await s.eval((t) => window.__click(t), "Открыть смену");
    await s.eval(() => window.__sleep(600));
    ok = (await report(s, "касса, смена открыта")) && ok;
    await s.eval((t) => window.__click(t), "Внести деньги");
    await s.eval(() => window.__sleep(400));
    ok = (await report(s, "диалог внесения")) && ok;
    // Проводим движение: список движений не должен быть пустым, иначе
    // строка с суммой и комментарием не измерена вовсе.
    for (const digit of ["5", "0", "0", "0", "0"])
      await s.eval((d) => window.__click(d), digit);
    await s.eval((t) => window.__click(t), "Провести");
    await s.eval(() => window.__sleep(400));
    // ККМ в браузере не заведена — X-отчёт отвечает предупреждением,
    // и полоса сверху сдвигает всё вниз. Меряем и с ней.
    await s.eval((t) => window.__click(t), "Печать X-отчёта");
    await s.eval(() => window.__sleep(400));
    ok = (await report(s, "движение проведено, предупреждение сверху")) && ok;
    return ok;
  },

  /*
   * Кухонный монитор. Меряется на **демо-данных**, а не против узла, и это
   * не лень: у позиций сида узла `prep_station_id` пуст, поэтому все тикеты
   * приезжают без станции, а тариф узла — `start`, где модуля `kds` нет вовсе
   * и экран недостижим. Дев-сервер для замера поднимается отдельный, чтобы
   * не трогать тот, что подключён к узлу:
   *
   *   VITE_NODE_URL= pnpm --filter @restopos/desktop dev --port 1425
   *   APP_URL=http://127.0.0.1:1425/ node tools/measure-screen.mjs kitchen
   */
  kitchen: async (s) => {
    // Чистое начало: заказы переживают перезагрузку, и второй проход
    // по разрешениям иначе начинается с чужих тикетов.
    await s.eval(() => {
      for (const key of Object.keys(localStorage))
        if (key.startsWith("restopos.")) localStorage.removeItem(key);
      return true;
    });
    await reopen(s);

    // Заказ набираем на прилавке: «К оплате» там делает `fireOrder`, то есть
    // отправляет позиции на кухню, — больше от кассы ничего не нужно.
    await s.eval((t) => window.__clickDev(t), "Прилавок");
    await s.eval(() => window.__sleep(400));
    await s.eval((t) => window.__clickMain(t), "Прилавок");
    await s.eval(() => window.__sleep(600));

    // Горячее и напитки: заказ обязан разъехаться на две станции, иначе
    // ни подпись станции в тикете, ни счётчики в колонке не измерены.
    await s.eval((t) => window.__clickMain(t), "Горячее");
    await s.eval(() => window.__sleep(300));
    await s.eval(() => {
      const tiles = [...document.querySelectorAll("button")].filter((el) =>
        el.className.includes("h-24"),
      );
      if (tiles.length === 0) throw new Error("не нашёл плитку меню");
      for (const tile of tiles.slice(0, 3)) tile.click();
      return true;
    });
    await s.eval((t) => window.__clickMain(t), "Напитки");
    await s.eval(() => window.__sleep(300));
    await s.eval(() => {
      const tile = [...document.querySelectorAll("button")].find(
        (el) => el.className.includes("h-24") && el.textContent.includes("Лимонад"),
      );
      if (!tile) throw new Error("не нашёл напиток для бара");
      tile.click();
      return true;
    });
    await s.eval(() => window.__sleep(300));
    await s.eval((t) => window.__clickMain(t), "К оплате");
    await s.eval(() => window.__sleep(700));

    /*
     * Размножаем отправленный заказ прямо в хранилище. Одним тикетом сетка
     * не проверяется вовсе, а просроченного через интерфейс не дождаться:
     * красным тикет становится через пятнадцать минут.
     */
    await s.eval(() => {
      const state = JSON.parse(localStorage.getItem("restopos.orders"));
      const base = Object.values(state.orders).find(
        (order) => order.status === "sent_to_kitchen",
      );
      if (!base) throw new Error("заказ не ушёл на кухню");
      const items = Object.values(state.items).filter(
        (item) => item.orderId === base.id,
      );
      [6, 25].forEach((minutes, copy) => {
        const orderId = `probe-order-${copy}`;
        state.orders[orderId] = {
          ...base,
          id: orderId,
          number: base.number + copy + 1,
          createdAt: new Date(Date.now() - minutes * 60_000).toISOString(),
        };
        items.forEach((item, k) => {
          const id = `probe-item-${copy}-${k}`;
          state.items[id] = { ...item, id, orderId, quantity: k + 1 };
        });
      });
      localStorage.setItem("restopos.orders", JSON.stringify(state));
      // Тип терминала читается один раз в инициализаторе `useState`,
      // поэтому дальше обязательно перезагрузка.
      localStorage.setItem("restopos.terminal.kind", JSON.stringify("kds"));
      return true;
    });
    await reopen(s);
    await s.eval((t) => window.__clickMain(t), "Кухня");
    await s.eval(() => window.__sleep(600));
    let ok = await report(s, "кухня, тикеты двух станций");

    // Отмеченная позиция — своё состояние: перечёркнутая строка и галка.
    await s.eval(() => {
      const el = document.querySelector("main article ul button");
      if (!el) throw new Error("не нашёл строку тикета");
      el.click();
      return true;
    });
    await s.eval(() => window.__sleep(300));
    ok = (await report(s, "позиция отмечена готовой")) && ok;

    // Одна станция вместо всех: у тикетов пропадает подпись цеха.
    await s.eval((t) => window.__clickMain(t), "Бар");
    await s.eval(() => window.__sleep(400));
    ok = (await report(s, "выбран бар")) && ok;

    // Пустой экран — тоже раскладка, и на кухне он основное состояние.
    await s.eval(() => {
      localStorage.removeItem("restopos.orders");
      return true;
    });
    await reopen(s);
    await s.eval((t) => window.__clickMain(t), "Кухня");
    await s.eval(() => window.__sleep(400));
    ok = (await report(s, "тикетов нет")) && ok;
    return ok;
  },
};

await waitPort();
const target = await (
  await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(APP)}`, { method: "PUT" })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const s = new Session(ws);
await s.send("Page.enable");
await s.send("Runtime.enable");

let allOk = true;
for (const [width, height] of sizes) {
  await s.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await s.send("Page.navigate", { url: APP });
  await s.eval(() => new Promise((r) => setTimeout(r, 1600)));
  await s.eval(helpers);
  console.log(`\n=== ${screen} @ ${width}x${height} ===`);
  allOk = (await flows[screen](s)) && allOk;
}
console.log(allOk ? "\nВСЁ ЗЕЛЁНОЕ" : "\nЕСТЬ НАРУШЕНИЯ");
chrome.kill();
process.exit(allOk ? 0 : 1);
