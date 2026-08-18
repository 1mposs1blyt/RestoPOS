// Генерация типов и матрицы прав из нейтрального контракта — сразу в оба языка.
//
// Направление именно такое — JSON канонический, TS и C# производные, — потому что
// узел пишется на C#/C++ и импортировать TypeScript не может. Обратное
// направление (TS канонический, JSON выгружается) потребовало бы запускать
// TypeScript в сборке ради одного файла.
//
//   node scripts/build-contract.mjs           — сгенерировать
//   node scripts/build-contract.mjs --check   — проверить, что не разъехалось
//
// Литеральные union-типы и списки прав генерируются, а не пишутся руками.
// Как это выглядит иначе, уже видели: у узла была своя рукописная таблица
// `GetPermissionsForRole`, где у менеджера не оказалось `hall.layout.edit`, —
// и конструктор зала пропадал с экрана, стоило подключить кассу к узлу.
// Расхождение здесь — это не опечатка, а дыра в доступе.

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
const csharpTarget = join(
  root,
  "apps",
  "backend",
  "server",
  "Contract.generated.cs",
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

// ── Тарифы ──────────────────────────────────────────────────────────────────
//
// Проверок здесь больше, чем у прав, и не от занудства: тариф — это механизм
// монетизации, и ошибка в нём либо отдаёт оплаченный модуль бесплатно, либо
// отбирает у клиента то, за что он заплатил. Оба случая замечают не в тестах.

const QUOTA_FIELDS = ["maxTerminals", "maxVenues", "maxStaff"];

// Коды уходят в оба языка ключами объекта и словаря, поэтому держим их
// пригодными для идентификатора: «multi-venue» с дефисом сгенерировал бы
// синтаксически неверный TypeScript, и упало бы это уже в чужом файле.
for (const code of [...contract.planCodes, ...contract.featureCodes]) {
  if (!/^[a-z][a-z0-9_]*$/.test(code)) {
    throw new Error(
      `код «${code}»: допустимы строчные латинские буквы, цифры и подчёркивание`,
    );
  }
}

for (const plan of contract.planCodes) {
  if (!(plan in contract.planFeatures)) {
    throw new Error(`planFeatures: не описан тариф «${plan}»`);
  }
  if (!(plan in contract.planQuotas)) {
    throw new Error(`planQuotas: не описан тариф «${plan}»`);
  }
  for (const feature of contract.planFeatures[plan]) {
    if (!contract.featureCodes.includes(feature)) {
      throw new Error(`planFeatures.${plan}: «${feature}» нет в featureCodes`);
    }
  }
  for (const field of QUOTA_FIELDS) {
    const value = contract.planQuotas[plan][field];
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(
        `planQuotas.${plan}.${field}: ожидалось целое ≥ 1, получено ${JSON.stringify(value)}`,
      );
    }
  }
}
for (const plan of Object.keys(contract.planFeatures)) {
  if (!contract.planCodes.includes(plan)) {
    throw new Error(`planFeatures: тарифа «${plan}» нет в planCodes`);
  }
}

// Лестница обязана расти. `planCodes` перечислены от дешёвого к дорогому, и
// апгрейд, который что-то ОТБИРАЕТ, — это не опечатка, а счёт клиента за то,
// чего он лишился. Ловим на сборке, а не по обращению в поддержку.
for (let i = 1; i < contract.planCodes.length; i += 1) {
  const lower = contract.planCodes[i - 1];
  const upper = contract.planCodes[i];

  for (const feature of contract.planFeatures[lower]) {
    if (!contract.planFeatures[upper].includes(feature)) {
      throw new Error(
        `planFeatures: «${upper}» дороже «${lower}», но не включает «${feature}»`,
      );
    }
  }
  for (const field of QUOTA_FIELDS) {
    if (contract.planQuotas[upper][field] < contract.planQuotas[lower][field]) {
      throw new Error(
        `planQuotas: «${upper}» дороже «${lower}», но ${field} меньше`,
      );
    }
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

/** `["a", "b"]` элементами по строке с заданным отступом. */
function csList(values, indent) {
  return values.map((value) => `${indent}${JSON.stringify(value)},`).join("\n");
}

const csRolePermissions = contract.roles
  .map((role) => {
    const list = csList(contract.rolePermissions[role], "            ");
    return `        [${JSON.stringify(role)}] = new[]\n        {\n${list}\n        },`;
  })
  .join("\n");

const csharpOutput = `/*
 * СГЕНЕРИРОВАННЫЙ ФАЙЛ — не редактировать.
 * Источник: contracts/contract.json, генератор: scripts/build-contract.mjs.
 * Пересобрать: pnpm contracts:build
 *
 * Матрица прав у узла и у терминала обязана быть одной и той же. Рукописная
 * копия здесь разъезжается с фронтом на первой же правке контракта, и заметно
 * это становится по симптому вида «у менеджера пропал конструктор зала».
 */

namespace server;

public static class Contract
{
    public const int Version = ${contract.version};

    /** Шаблон имени комнаты realtime. Должен совпадать байт-в-байт с терминалом. */
    public const string RoomPattern = ${JSON.stringify(contract.conventions.roomPattern)};

    public static readonly IReadOnlyList<string> Roles = new[]
    {
${csList(contract.roles, "        ")}
    };

    public static readonly IReadOnlyList<string> Permissions = new[]
    {
${csList(contract.permissions, "        ")}
    };

    public static readonly IReadOnlyList<string> ErrorCodes = new[]
    {
${csList(contract.errorCodes, "        ")}
    };

    public static readonly IReadOnlyList<string> EventTopics = new[]
    {
${csList(contract.eventTopics, "        ")}
    };

    /// <summary>Права, которые можно получить разово — подтверждением сотрудника, у которого они есть по роли.</summary>
    public static readonly IReadOnlySet<string> Overridable = new HashSet<string>
    {
${csList(contract.overridablePermissions, "        ")}
    };

    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> RolePermissions =
        new Dictionary<string, IReadOnlyList<string>>
    {
${csRolePermissions}
    };

    /// <summary>Права роли. Неизвестная роль — пустой набор, а не исключение: отказ решает вызывающий.</summary>
    public static IReadOnlyList<string> PermissionsOf(string role) =>
        RolePermissions.TryGetValue(role, out var permissions) ? permissions : Array.Empty<string>();

    public static bool HasPermission(string role, string permission) =>
        PermissionsOf(role).Contains(permission);

    /// <summary>
    /// Может ли обладатель роли подтвердить чужое действие. Подтверждает тот,
    /// у кого право есть по роли, — не обязательно менеджер: возврат и чужой
    /// заказ кассир подтверждает сам.
    /// </summary>
    public static bool CanApprove(string role, string permission) =>
        Overridable.Contains(permission) && HasPermission(role, permission);
}
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

const artifacts = [
  { path: target, name: "contract.generated.ts", content: output },
  { path: csharpTarget, name: "Contract.generated.cs", content: csharpOutput },
];

if (process.argv.includes("--check")) {
  const stale = artifacts.filter(
    (artifact) => !sameIgnoringEol(readFileSync(artifact.path, "utf8"), artifact.content),
  );
  if (stale.length > 0) {
    console.error(
      `${stale.map((artifact) => artifact.name).join(", ")} ` +
        "не соответствует contracts/contract.json.\n" +
        "Выполните: pnpm contracts:build",
    );
    process.exit(1);
  }
  console.log("Контракт согласован.");
} else {
  for (const artifact of artifacts) {
    writeFileSync(artifact.path, artifact.content, "utf8");
  }
  console.log(
    `Сгенерировано (${artifacts.length} файла): ${contract.permissions.length} прав, ` +
      `${contract.roles.length} ролей, ${contract.errorCodes.length} кодов ошибок.`,
  );
}
