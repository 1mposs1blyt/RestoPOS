// Генерация TypeScript-типов из нейтрального контракта.
//
// Направление именно такое — JSON канонический, TS производный, — потому что
// бэкенд будет на C#/C++ и импортировать TypeScript не может. Обратное
// направление (TS канонический, JSON выгружается) потребовало бы запускать
// TypeScript в сборке ради одного файла.
//
//   node scripts/build-contract.mjs           — сгенерировать
//   node scripts/build-contract.mjs --check   — проверить, что не разъехалось
//
// Литеральные union-типы генерируются, а не пишутся руками: иначе список прав
// в JSON и в TS разъедутся на первой же правке, а расхождение здесь означает
// дыру в доступе.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "contracts", "contract.json");
const target = join(
  root,
  "packages",
  "shared-types",
  "src",
  "contract.generated.ts",
);

const contract = JSON.parse(readFileSync(source, "utf8"));

/** `"a" | "b"` с переносами, чтобы длинные union'ы читались. */
function union(values) {
  return values.map((value) => `  | ${JSON.stringify(value)}`).join("\n");
}

function assertKnown(values, known, what) {
  for (const value of values) {
    if (!known.includes(value)) {
      throw new Error(`${what}: «${value}» нет в списке permissions`);
    }
  }
}

// Проверки согласованности самого JSON — до генерации, чтобы ошибка вылезала
// здесь, а не невнятным типом в чужом файле.
assertKnown(contract.overridablePermissions, contract.permissions, "overridablePermissions");
for (const [role, permissions] of Object.entries(contract.rolePermissions)) {
  if (!contract.roles.includes(role)) {
    throw new Error(`rolePermissions: роли «${role}» нет в списке roles`);
  }
  assertKnown(permissions, contract.permissions, `rolePermissions.${role}`);
}
for (const role of contract.roles) {
  if (!(role in contract.rolePermissions)) {
    throw new Error(`rolePermissions: не описана роль «${role}»`);
  }
}

const rolePermissions = contract.roles
  .map((role) => {
    const list = contract.rolePermissions[role]
      .map((permission) => `    ${JSON.stringify(permission)},`)
      .join("\n");
    return `  ${role}: [\n${list}\n  ],`;
  })
  .join("\n");

const output = `/*
 * СГЕНЕРИРОВАННЫЙ ФАЙЛ — не редактировать.
 * Источник: contracts/contract.json, генератор: scripts/build-contract.mjs.
 * Пересобрать: pnpm contracts:build
 *
 * Контракт нейтрален по языку намеренно: бэкенд пишется на C#/C++ и читает
 * тот же JSON. Матрица прав, продублированная руками в двух языках, разъедется
 * на первой правке, а расхождение здесь — это дыра в доступе.
 */

export const CONTRACT_VERSION = ${contract.version};

/** Шаблон имени комнаты realtime. Должен совпадать байт-в-байт с бэкендом. */
export const ROOM_PATTERN = ${JSON.stringify(contract.conventions.roomPattern)};

export type ContractRole =
${union(contract.roles)};

export type ContractPermission =
${union(contract.permissions)};

export type ContractErrorCode =
${union(contract.errorCodes)};

export type ContractEventTopic =
${union(contract.eventTopics)};

export const CONTRACT_ROLES: readonly ContractRole[] = [
${contract.roles.map((r) => `  ${JSON.stringify(r)},`).join("\n")}
];

export const CONTRACT_PERMISSIONS: readonly ContractPermission[] = [
${contract.permissions.map((p) => `  ${JSON.stringify(p)},`).join("\n")}
];

export const CONTRACT_ERROR_CODES: readonly ContractErrorCode[] = [
${contract.errorCodes.map((c) => `  ${JSON.stringify(c)},`).join("\n")}
];

export const CONTRACT_EVENT_TOPICS: readonly ContractEventTopic[] = [
${contract.eventTopics.map((t) => `  ${JSON.stringify(t)},`).join("\n")}
];

/** Права, которые можно получить разово — подтверждением старшего сотрудника. */
export const CONTRACT_OVERRIDABLE: readonly ContractPermission[] = [
${contract.overridablePermissions.map((p) => `  ${JSON.stringify(p)},`).join("\n")}
];

export const CONTRACT_ROLE_PERMISSIONS: Record<
  ContractRole,
  readonly ContractPermission[]
> = {
${rolePermissions}
};
`;

/**
 * Сравнение без учёта переводов строк.
 *
 * Git на Windows отдаёт файл с CRLF (`core.autocrlf`), а генератор всегда пишет
 * LF — побайтовая сверка падала на свежем клоне, хотя содержимое совпадало
 * до символа. Расхождение контракта — вещь серьёзная, и сообщать о нём из-за
 * перевода строки значит приучить не верить проверке.
 */
const sameIgnoringEol = (a, b) =>
  a.replace(/\r\n/g, "\n") === b.replace(/\r\n/g, "\n");

if (process.argv.includes("--check")) {
  const current = readFileSync(target, "utf8");
  if (!sameIgnoringEol(current, output)) {
    console.error(
      "contract.generated.ts не соответствует contracts/contract.json.\n" +
        "Выполните: pnpm contracts:build",
    );
    process.exit(1);
  }
  console.log("Контракт согласован.");
} else {
  writeFileSync(target, output, "utf8");
  console.log(
    `Сгенерировано: ${contract.permissions.length} прав, ` +
      `${contract.roles.length} ролей, ${contract.errorCodes.length} кодов ошибок.`,
  );
}
