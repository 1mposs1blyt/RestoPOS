// Гейт Rust-части кассы: тесты плюс сборка релиза.
//
//   pnpm verify:rust
//
// Отдельно от `pnpm verify`, а не внутри него, и это решение, а не недоделка:
// полминуты сборки Rust на каждую правку вёрстки — цена, которую перестанут
// платить, и обходить начнут гейт целиком. Но и без него нельзя: `pnpm verify`
// не трогает Rust вовсе и остаётся зелёным при сломанном `cargo test`
// и не собирающемся релизе — так уже случалось, поломка прожила несколько
// коммитов (CLAUDE.md, «Два входа в крейт»).
//
// Проверок две, и вторая не следует из первой: отладочная сборка переживает
// почти всё, чем та поломка проявлялась, — `fiscal_simulate` в
// `generate_handler!` без `cfg` виден только релизу.
//
// `cargo` в PATH текущей оболочки может не быть (на этой машине он живёт
// в `~/.cargo/bin`), поэтому каталог добавляется скриптом, а не инструкцией
// в README, которую забудут выполнить.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const crate = join(root, "apps", "desktop", "src-tauri");

/**
 * PATH с добавленным `~/.cargo/bin`.
 *
 * Ключ ищется без учёта регистра: под Windows он зовётся `Path`, и добавив
 * рядом свой `PATH`, получишь две переменные вместо одной.
 */
function envWithCargo() {
  const env = { ...process.env };
  const key = Object.keys(env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
  env[key] = [join(homedir(), ".cargo", "bin"), env[key] ?? ""]
    .filter(Boolean)
    .join(delimiter);
  return { env, path: env[key] };
}

/**
 * Путь к cargo. Ищем сами, а не полагаемся на `shell: true`: разрешение по
 * PATHEXT под Windows spawn не делает, и запуск падал бы на ENOENT вместо
 * внятного сообщения.
 */
function findCargo(path) {
  const names = process.platform === "win32" ? ["cargo.exe", "cargo.bat"] : ["cargo"];
  for (const dir of path.split(delimiter)) {
    if (!dir) continue;
    for (const name of names) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

const { env, path } = envWithCargo();
const cargo = findCargo(path);

if (!cargo) {
  console.error(
    "cargo не найден ни в PATH, ни в ~/.cargo/bin. Rust-часть кассы не проверена.",
  );
  process.exit(1);
}

const checks = [
  ["тесты обоих слоёв", ["test", "--lib"]],
  ["сборка релиза", ["check", "--release"]],
];

for (const [title, args] of checks) {
  console.log(`\n== ${title}: cargo ${args.join(" ")}\n`);
  const { status, error } = spawnSync(cargo, args, {
    cwd: crate,
    stdio: "inherit",
    env,
  });
  if (error) {
    console.error(`\nне удалось запустить cargo: ${error.message}`);
    process.exit(1);
  }
  if (status !== 0) {
    console.error(`\n${title}: провал (код ${status})`);
    process.exit(status ?? 1);
  }
}

console.log("\nRust-часть кассы проверена: тесты и релиз зелёные.");
