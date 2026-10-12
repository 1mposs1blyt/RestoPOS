import { Fragment, useLayoutEffect, useRef, useState } from "react";
import type { UUID } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { useSession } from "../app/session";
import { FunctionBar, FunctionKey } from "../components/functionbar";
import { useHallOccupancy } from "../state/occupancy";
import {
  findDuplicateLabels,
  useTables,
  type TableLayout,
  type TablesStatus,
} from "../state/tables";
import { formatMoney } from "../lib/money";
import { formatElapsed, useNow } from "../lib/useNow";

/** Сторона кнопки удаления стола: цель касания, а не украшение угла. */
const REMOVE_SIZE = 44;

interface DragState {
  tableId: UUID;
  /** Смещение точки захвата от левого верхнего угла стола, в пикселях. */
  offsetX: number;
  offsetY: number;
}

/**
 * Схема зала рисуется 1:1, без масштабирования.
 *
 * Раньше здесь была логическая поверхность, которая вписывалась в экран,
 * и это вышло боком: поверхность 16:9 не совпадала по пропорциям с полосой
 * зала (около 2.7:1), упиралась высота, и чем аккуратнее менеджер заполнял
 * холст конструктора, тем сильнее всё сжималось при выходе из него.
 * Вдобавок масштаб зависел от самого дальнего стола.
 *
 * Теперь холст конструктора и холст просмотра — один и тот же элемент:
 * что разложил, то и видишь. Переносимость между терминалами даёт хранение
 * координат в долях холста (`cx`/`cy`), а размер стола остаётся в пикселях,
 * чтобы он не сжимался ниже пальца.
 */

/**
 * Схема зала: расстановка столов и вход в заказ.
 *
 * Занятость стола не хранится — она вычисляется из активных заказов
 * (`useOrders().tableStatus`). Режим конструктора доступен только менеджеру:
 * роль и тариф проверяются независимо, здесь важна именно роль.
 */
export function TableScheme() {
  const { navigate, back, canGoBack } = useNavigation();
  const { can } = useAccess();
  const {
    tables,
    status,
    error,
    reload,
    canEditStructure,
    addTable,
    moveTable,
    commitTable,
    removeTable,
    renameTable,
  } = useTables();
  const { venue } = useSession();
  const { occupancyOf, isRemote, error: occupancyError } =
    useHallOccupancy(venue.id);
  const now = useNow();

  /*
   * Стол занят заказом, который ведётся на узле. Экран заказа к узлу ещё
   * не подключён, поэтому открывать его нельзя: локальный стор про этот заказ
   * не знает и завёл бы рядом второй. Два заказа на одном столе — это еда,
   * за которую в итоге никто не заплатит.
   */
  const [blockedTable, setBlockedTable] = useState<string | null>(null);

  // Дубли могли накопиться раньше, когда номер брался из длины массива.
  // Молча перенумеровывать чужую расстановку нельзя — показываем их менеджеру.
  const duplicates = findDuplicateLabels(tables);

  // Право, а не роль: «расстановку меняет менеджер» — сегодняшнее содержимое
  // матрицы, а не свойство экрана.
  const canEditLayout = can("hall.layout.edit");
  const [isDesignMode, setDesignMode] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState({ width: 0, height: 0 });

  const designMode = isDesignMode && canEditLayout;

  useLayoutEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const measure = () =>
      setCanvas({ width: element.clientWidth, height: element.clientHeight });

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /** Пиксельные координаты левого верхнего угла стола на текущем холсте. */
  const positionOf = (table: TableLayout) => ({
    left: clamp(
      table.cx * canvas.width - table.width / 2,
      0,
      canvas.width - table.width,
    ),
    top: clamp(
      table.cy * canvas.height - table.height / 2,
      0,
      canvas.height - table.height,
    ),
  });

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    table: TableLayout,
  ) => {
    if (!designMode || event.button !== 0) return;
    event.preventDefault();

    // Захватываем указатель: дальше move/up приходят на этот же элемент,
    // даже если палец ушёл за его границы.
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    setDrag({
      tableId: table.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
    table: TableLayout,
  ) => {
    if (!drag || drag.tableId !== table.id || !canvasRef.current) return;
    event.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const left = clamp(
      event.clientX - rect.left - drag.offsetX,
      0,
      canvas.width - table.width,
    );
    const top = clamp(
      event.clientY - rect.top - drag.offsetY,
      0,
      canvas.height - table.height,
    );

    // Обратно в доли холста — храним только их.
    moveTable(
      table.id,
      (left + table.width / 2) / canvas.width,
      (top + table.height / 2) / canvas.height,
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    // Сохраняем один раз, когда палец отпущен: во время перетаскивания
    // положение меняется десятки раз в секунду.
    commitTable(drag.tableId);
    setDrag(null);
  };

  return (
    /*
     * Обвязка холста — как на заказе, прилавке, оплате и кухне: плоские панели,
     * разделённые границей в пиксель, без внешних отступов и скруглений,
     * функции полосой внизу. Сам холст не тронут: он рисуется 1:1 и хранит
     * координаты в долях (причина — в комментарии выше), масштабирование
     * здесь уже пробовали, и оно оказалось хуже.
     */
    <div className="flex h-full w-full select-none flex-col overflow-hidden bg-slate-950">
      {/* Шапка несёт только состояние: что за экран, сколько столов и что
          с ними не так. Действия ушли вниз, в полосу функций: разложенные
          по двум углам экрана, они заставляют глаз искать. */}
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="shrink-0 text-lg font-black tracking-wide text-emerald-400">
            Схема зала
          </h2>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-500">
            столов {tables.length}
          </span>
          {status === "loading" && (
            <span className="shrink-0 text-sm text-slate-500">загрузка…</span>
          )}
          {duplicates.size > 0 && (
            <span className="bg-rose-950/70 px-2 py-1 text-xs font-semibold text-rose-300">
              Повторяются номера: {[...duplicates].join(", ")}
            </span>
          )}
          {error && (
            // Кнопки здесь нет: перечитать зал предлагает полоса функций внизу,
            // а шапка говорит, что случилось.
            <span className="truncate bg-rose-950/70 px-2 py-1 text-xs font-semibold text-rose-300">
              {error}
            </span>
          )}
          {occupancyError && (
            // Схема при этом остаётся на экране с прошлыми данными: мигающий
            // зал в час пик хуже, чем зал, отставший на десять секунд.
            <span className="shrink-0 bg-amber-950/60 px-2 py-1 text-xs text-amber-300">
              Занятость не обновляется
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {designMode && !canEditStructure && (
            // Узел умеет сохранять только геометрию: маршрутов на создание
            // и удаление стола у него нет. Молча показывать кнопки, после
            // которых зал вернётся прежним, нельзя.
            <span className="max-w-72 text-xs leading-tight text-slate-500">
              Столы двигаются и сохраняются на узле. Добавление и удаление —
              когда узел научится.
            </span>
          )}
          {!canEditLayout && (
            <span className="text-xs text-slate-600">
              Расстановку меняет менеджер
            </span>
          )}
          {designMode && (
            // Режим виден и без взгляда на полосу функций: конструктор меняет
            // смысл каждого касания холста, и перепутать его с залом дорого.
            <span className="bg-orange-500 px-2 py-1 text-xs font-black uppercase tracking-wide text-white">
              Конструктор
            </span>
          )}
        </div>
      </header>

      <div
        ref={canvasRef}
        className="relative min-h-0 w-full flex-1 overflow-hidden bg-slate-950"
        style={{
          backgroundImage:
            "radial-gradient(circle, #334155 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {tables.map((table) => {
          const occupancy = occupancyOf(table.id);
          // Не `status`: так называется состояние загрузки всего зала, и две
          // разные величины под одним именем в одном файле — заготовка ошибки.
          const isBusy = occupancy !== null;
          const isDragging = drag?.tableId === table.id;
          const isDuplicate = duplicates.has(table.label);
          const { left, top } = positionOf(table);
          /*
           * Кнопка удаления лежит на холсте, а не внутри стола, и это
           * не косметика. Висящая за углом стола, она вылезала за границу
           * холста у крайних столов — а холст обрезает вышедшее, и удалить
           * такой стол было нечем. Заодно стол переставал быть прямоугольником
           * своего размера: торчащий угол давал ему прокрутку внутри себя.
           * Здесь кнопка половиной ложится на угол, а положение прижимается
           * к холсту — как и сам стол.
           */
          const remove = {
            left: clamp(
              left + table.width - REMOVE_SIZE / 2,
              0,
              canvas.width - REMOVE_SIZE,
            ),
            top: clamp(top - REMOVE_SIZE / 2, 0, canvas.height - REMOVE_SIZE),
          };

          return (
            <Fragment key={table.id}>
              <div
                onPointerDown={(event) => handlePointerDown(event, table)}
                onPointerMove={(event) => handlePointerMove(event, table)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={() => {
                  if (designMode) return;
                  if (isRemote(table.id)) {
                    setBlockedTable(table.label);
                    return;
                  }
                  navigate({ name: "order", tableId: table.id });
                }}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${table.width}px`,
                  height: `${table.height}px`,
                  zIndex: isDragging ? 50 : 10,
                }}
                className={cn(
                  "flex touch-none items-center justify-center border-2 font-bold shadow-md transition-colors duration-150",
                  table.shape === "circle" ? "rounded-full" : "rounded-xl",
                  designMode
                    ? isDuplicate
                      ? "cursor-grab border-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
                      : isDragging
                        ? "cursor-grabbing border-orange-400 bg-orange-500/20 shadow-lg shadow-orange-500/10"
                        : "cursor-grab border-orange-500/40 bg-orange-500/5 hover:border-orange-400 hover:bg-orange-500/10"
                    : isBusy
                      ? "cursor-pointer border-amber-500/60 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/20"
                      : "cursor-pointer border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-400 hover:bg-emerald-500/15",
                )}
              >
                <div
                  className={cn(
                    "flex flex-col items-center leading-tight",
                    !designMode && "pointer-events-none",
                  )}
                >
                  <span className="mb-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Стол
                  </span>
                  {designMode && canEditStructure ? (
                    // Номер правится прямо на схеме: иначе развести накопившиеся
                    // дубли можно только удалив стол вместе с его местом.
                    <input
                      value={table.label}
                      maxLength={4}
                      onChange={(event) =>
                        renameTable(table.id, event.target.value.trim())
                      }
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Номер стола ${table.label}`}
                      className={cn(
                        "min-h-11 w-16 rounded bg-slate-950/60 text-center text-lg font-bold outline-none",
                        "focus:ring-2 focus:ring-orange-400",
                        isDuplicate ? "text-rose-300" : "text-orange-400",
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        "text-lg",
                        isBusy ? "text-amber-400" : "text-emerald-400",
                      )}
                    >
                      {table.label}
                    </span>
                  )}
                  {!designMode && occupancy && (
                    <>
                      {/* Сумма — только когда источник её действительно знает.
                          Узел отдаёт 0.00 константой, и «0 ₽» на занятом столе
                          официант прочтёт как «ничего не заказано». */}
                      {occupancy.total !== null && (
                        <span className="mt-1 text-[11px] font-semibold tabular-nums text-slate-300">
                          {formatMoney(occupancy.total)}
                        </span>
                      )}
                      <span className="text-[10px] tabular-nums text-slate-500">
                        {formatElapsed(occupancy.createdAt, now)}
                      </span>
                      <span className="text-[10px] tabular-nums text-slate-500">
                        {occupancy.guestCount} гост
                        {guestSuffix(occupancy.guestCount)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Кнопка удаления — соседка стола на холсте, а не его часть:
                  см. расчёт `remove` выше. */}
              {designMode && canEditStructure && (
                <button
                  type="button"
                  // Стол с активным заказом удалять нельзя: заказ остался бы
                  // без стола — из зала до него не добраться, а значит его
                  // не закрыть и не оплатить. Сначала закрывают счёт.
                  disabled={Boolean(occupancy)}
                  onClick={() => removeTable(table.id)}
                  style={{
                    position: "absolute",
                    left: `${remove.left}px`,
                    top: `${remove.top}px`,
                    width: `${REMOVE_SIZE}px`,
                    height: `${REMOVE_SIZE}px`,
                    zIndex: 60,
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 border-slate-950 text-sm font-black shadow-md",
                    occupancy
                      ? "cursor-not-allowed bg-slate-700 text-slate-500"
                      : "bg-rose-500 text-white hover:bg-rose-600 active:scale-90",
                  )}
                  aria-label={
                    occupancy
                      ? `Стол ${table.label} нельзя удалить: есть открытый заказ`
                      : `Удалить стол ${table.label}`
                  }
                  title={
                    occupancy ? "Сначала закройте заказ на этом столе" : undefined
                  }
                >
                  ✕
                </button>
              )}
            </Fragment>
          );
        })}

        {tables.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-600">
            <span className="mb-2 text-4xl">{status === "error" ? "🔌" : "🍽️"}</span>
            <p className="text-sm">{emptyHint(status, canEditLayout, canEditStructure)}</p>
          </div>
        )}
      </div>

      {/* Полоса функций внизу — общий компонент, см. components/functionbar.
          Набор клавиш зависит от режима: в конструкторе холст принимает столы,
          и держать кнопки их добавления где-то ещё значит развести действия
          над одним и тем же по разным углам экрана. */}
      <FunctionBar>
        {canGoBack && <FunctionKey label="← Назад" onClick={back} />}
        {designMode && canEditStructure && (
          <>
            <FunctionKey
              label="+ Прямоугольный"
              onClick={() => addTable("rectangle")}
            />
            <FunctionKey
              label="+ Квадратный"
              onClick={() => addTable("square")}
            />
            <FunctionKey label="+ Круглый" onClick={() => addTable("circle")} />
          </>
        )}
        <FunctionKey
          label={status === "loading" ? "Обновляется…" : "Обновить"}
          disabled={status === "loading"}
          onClick={reload}
        />
        {canEditLayout && (
          <FunctionKey
            label={designMode ? "Сохранить расстановку" : "Конструктор зала"}
            tone={designMode ? "accept" : "plain"}
            onClick={() => {
              setDrag(null);
              setDesignMode((prev) => !prev);
            }}
          />
        )}
      </FunctionBar>

      {blockedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6">
          <div className="w-96 space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">
            <span className="text-4xl">🔒</span>
            <h2 className="text-lg font-black text-slate-100">
              Стол {blockedTable} занят заказом с узла
            </h2>
            <p className="text-sm leading-snug text-slate-400">
              Зал уже читает занятость из базы заведения, а экран заказа
              к узлу ещё не подключён. Открыть его здесь значит завести рядом
              второй счёт на тот же стол.
            </p>
            <button
              type="button"
              onClick={() => setBlockedTable(null)}
              className="min-h-14 w-full rounded-xl bg-slate-800 text-sm font-bold text-slate-200 transition hover:bg-slate-700 active:scale-95"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** «1 гость», «2 гостя», «5 гостей» — зал читают мельком, и рябь в тексте мешает. */
function guestSuffix(count: number): string {
  const tail = count % 100;
  if (tail >= 11 && tail <= 14) return "ей";
  switch (count % 10) {
    case 1:
      return "ь";
    case 2:
    case 3:
    case 4:
      return "я";
    default:
      return "ей";
  }
}

/**
 * Что написать на пустом холсте.
 *
 * Пустой зал, недоехавший зал и зал, который ещё грузится, выглядят одинаково,
 * а означают разное: в двух случаях из трёх менеджеру не надо ничего делать,
 * и предлагать ему «включите конструктор» — это отправить его исправлять
 * то, что не сломано.
 */
function emptyHint(
  status: TablesStatus,
  canEditLayout: boolean,
  canEditStructure: boolean,
): string {
  if (status === "loading") return "Загружаем схему зала…";
  if (status === "error") return "Схема зала не загрузилась — узел не ответил.";
  if (!canEditStructure) return "В этом заведении столы ещё не заведены.";
  return canEditLayout
    ? "На холсте пока нет столов — включите режим конструктора."
    : "Схема зала ещё не настроена.";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
