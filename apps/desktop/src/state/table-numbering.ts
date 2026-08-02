/**
 * Нумерация столов. Вынесено из `tables.tsx` отдельным модулем без React:
 * это чистые функции, их можно прогнать без рендера — и они первыми
 * просятся под тесты, когда в проекте появится раннер.
 */

export interface LabeledTable {
  label: string;
}

/**
 * Наименьший свободный номер.
 *
 * Раньше номер брался как `количество + 1`, и это давало дубли: после удаления
 * стола длина массива снова совпадала с уже занятой меткой. Нечисловые метки
 * (стол переименовали руками) в расчёте не участвуют.
 */
export function nextTableLabel(tables: LabeledTable[]): string {
  const used = new Set(
    tables
      .map((table) => Number(table.label))
      .filter((value) => Number.isInteger(value) && value > 0),
  );
  let candidate = 1;
  while (used.has(candidate)) candidate += 1;
  return String(candidate);
}

/** Метки, встречающиеся больше одного раза, — их подсвечивает конструктор. */
export function findDuplicateLabels(tables: LabeledTable[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const table of tables) {
    if (seen.has(table.label)) duplicates.add(table.label);
    else seen.add(table.label);
  }
  return duplicates;
}
