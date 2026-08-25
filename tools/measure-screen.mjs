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
  return true;
};

const measure = () => {
  // Меряем экран, а не оболочку: дев-панель внизу в релиз не попадает.
  const root = document.querySelector("main") ?? document.body;
  const box = root.getBoundingClientRect();
  const small = [];
  const wide = [];
  const cut = [];
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
  return {
    small,
    wide,
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
  const ok = r.small.length === 0 && r.cut.length === 0 && r.wide.length === 0;
  console.log(`  [${ok ? "ok" : "!!"}] ${name}: ширина ${r.rootW}, scrollWidth ${r.rootScrollW}`);
  for (const i of r.small) console.log(`      мелкая цель ${i.w}x${i.h} «${i.text}» | ${i.cls}`);
  for (const i of r.cut) console.log(`      вылезло ${i.tag} x ${i.left}..${i.right}, низ ${i.bottom} при ${i.box} | ${i.cls}`);
  for (const i of r.wide)
    console.log(`      скролл по горизонтали ${i.tag} ${i.scrollW}/${i.clientW} | ${i.cls}`);
  if (process.env.VERBOSE) console.log("      кнопки:", r.buttons);
  return ok;
}

const flows = {
  payment: async (s) => {
    for (let i = 0; i < 4; i += 1) await s.eval((d) => window.__click(d), "3"); // PIN 3333
    await s.eval(() => window.__sleep(1500));
    await s.eval((t, n) => window.__click(t, n), "Прилавок", 1);
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
