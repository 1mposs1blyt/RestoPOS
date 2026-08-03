import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Permission, Staff } from "@restopos/shared-types";
import { isOverridable } from "@restopos/shared-types";
import { PinPad } from "@restopos/ui-kit";
import { loadState, newId, saveState } from "../lib/storage";
import { roleLabel, useSession } from "./session";

/**
 * Права на действия и подтверждение «дорогих» операций.
 *
 * Здесь же — граница между двумя разными вопросами. «Можно ли сотруднику
 * это действие» решает `can`. «Состоится ли действие вообще» решает `authorize`:
 * права может не быть, но действие всё равно выполнимо, если рядом есть тот,
 * у кого право есть.
 *
 * ВАЖНО (инвариант №1): всё это UX. Реальный отказ обязан приходить с бэкенда —
 * `requirePermission(...)` и 403 `permission_denied` / `override_required`.
 * Скрытая кнопка не мешает отправить запрос в API напрямую.
 */

export const PERMISSION_LABELS: Record<Permission, string> = {
  "order.view": "Просмотр заказов",
  "order.create": "Открытие заказа",
  "order.item.add": "Добавление позиций",
  "order.send": "Отправка на кухню",
  "order.item.serve": "Выдача позиции гостю",
  "order.item.void": "Сторно отправленной позиции",
  "order.discount": "Скидка на заказ",
  "order.cancel": "Отмена заказа",
  "order.foreign": "Работа с чужим заказом",
  "payment.accept": "Приём оплаты",
  "payment.refund": "Возврат",
  "cash.drawer": "Внесение и изъятие наличных",
  "shift.open": "Открытие смены",
  "shift.close": "Закрытие смены",
  "report.x": "Сменный отчёт",
  "report.z": "Закрытие смены с гашением",
  "kitchen.view": "Кухонный экран",
  "kitchen.item.status": "Статусы позиций на кухне",
  "print.reprint": "Повторная печать марки",
  "station.manage": "Настройка станций приготовления",
  "hall.layout.edit": "Конструктор зала",
  "menu.stoplist": "Стоп-лист",
  "menu.edit": "Редактирование меню",
  "staff.manage": "Управление персоналом",
  "warehouse.view": "Просмотр склада",
  "warehouse.edit": "Изменение склада",
  "terminal.service": "Сервисный экран",
};

/** Результат авторизации действия. */
export interface Approval {
  /** Кто подтвердил. `null` — сотрудник выполнил действие своим правом. */
  approvedBy: Staff | null;
}

export interface AuditEntry {
  id: string;
  at: string;
  permission: Permission;
  /** Над чем действие: «Заказ № 12», «Стол 5». `null` — без привязки. */
  subject: string | null;
  actorName: string;
  actorRole: string;
  /** `null` — своим правом, без подтверждения. */
  approvedByName: string | null;
}

interface AccessValue {
  permissions: ReadonlySet<Permission>;
  /** Есть ли право у сотрудника прямо сейчас, без подтверждений. */
  can: (permission: Permission) => boolean;
  /** Выполнимо ли действие в принципе: своим правом или подтверждением. */
  isPossible: (permission: Permission) => boolean;
  /**
   * Разрешить действие. Промис резолвится, когда действие можно выполнять,
   * и отклоняется, если подтверждение отменили или его не может быть.
   * Отклонение — штатный путь, а не ошибка: вызывающий код просто ничего
   * не делает.
   */
  authorize: (permission: Permission, subject?: string) => Promise<Approval>;
  auditLog: AuditEntry[];
  clearAuditLog: () => void;
}

const AccessContext = createContext<AccessValue | null>(null);

const AUDIT_KEY = "access.audit";

/**
 * Сколько записей журнала держим локально. Настоящий журнал живёт в БД
 * (`audit_log`), здесь он до появления бэкенда и ограничен, чтобы не разносить
 * localStorage терминала, который месяцами не перезапускают.
 */
const AUDIT_LIMIT = 200;

interface PendingRequest {
  permission: Permission;
  subject: string | null;
  resolve: (approval: Approval) => void;
  reject: (reason: Error) => void;
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const { staff, permissions, approve: approvePin } = useSession();
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() =>
    loadState<AuditEntry[]>(AUDIT_KEY, []),
  );
  const [pending, setPending] = useState<PendingRequest | null>(null);

  // Промис висит между открытием диалога и вводом пина, а обработчики диалога
  // не должны пересоздаваться на каждый символ — держим запрос ещё и в ref.
  const pendingRef = useRef<PendingRequest | null>(null);

  const record = useCallback(
    (permission: Permission, subject: string | null, approvedBy: Staff | null) => {
      // Пишем только то, ради чего журнал существует: действия, которые
      // разбирают при недостаче. Открытие заказа в журнале — это шум,
      // в котором сторно уже не найти.
      if (!isOverridable(permission)) return;

      const entry: AuditEntry = {
        id: newId(),
        at: new Date().toISOString(),
        permission,
        subject,
        actorName: staff?.fullName ?? "—",
        actorRole: staff ? roleLabel(staff.role) : "—",
        approvedByName: approvedBy?.fullName ?? null,
      };

      setAuditLog((prev) => {
        const next = [entry, ...prev].slice(0, AUDIT_LIMIT);
        saveState(AUDIT_KEY, next);
        return next;
      });
    },
    [staff],
  );

  const can = useCallback(
    (permission: Permission) => permissions.has(permission),
    [permissions],
  );

  const isPossible = useCallback(
    (permission: Permission) =>
      permissions.has(permission) || isOverridable(permission),
    [permissions],
  );

  const authorize = useCallback(
    (permission: Permission, subject?: string): Promise<Approval> => {
      if (permissions.has(permission)) {
        record(permission, subject ?? null, null);
        return Promise.resolve({ approvedBy: null });
      }

      if (!isOverridable(permission)) {
        // Аналог 403 `permission_denied`: подтверждать нечего, диалога нет.
        return Promise.reject(
          new Error(`Действие недоступно: ${PERMISSION_LABELS[permission]}`),
        );
      }

      // Аналог 403 `override_required`: спрашиваем подтверждение.
      return new Promise<Approval>((resolve, reject) => {
        const request: PendingRequest = {
          permission,
          subject: subject ?? null,
          resolve,
          reject,
        };
        pendingRef.current = request;
        setPending(request);
      });
    },
    [permissions, record],
  );

  const closePending = useCallback(() => {
    pendingRef.current = null;
    setPending(null);
  }, []);

  const approve = useCallback(
    async (pin: string) => {
      const request = pendingRef.current;
      if (!request) return;

      // Проверку «есть ли у предъявителя это право» делает источник: локально
      // в демо-режиме, на узле — сервер. Исключение наверх не гасим: `PinPad`
      // подсветит и очистит поле сам.
      const approver = await approvePin(pin, request.permission);

      record(request.permission, request.subject, approver);
      closePending();
      request.resolve({ approvedBy: approver });
    },
    [approvePin, record, closePending],
  );

  const cancel = useCallback(() => {
    const request = pendingRef.current;
    closePending();
    request?.reject(new Error("Подтверждение отменено"));
  }, [closePending]);

  const clearAuditLog = useCallback(() => {
    setAuditLog([]);
    saveState(AUDIT_KEY, []);
  }, []);

  const value = useMemo<AccessValue>(
    () => ({
      permissions,
      can,
      isPossible,
      authorize,
      auditLog,
      clearAuditLog,
    }),
    [permissions, can, isPossible, authorize, auditLog, clearAuditLog],
  );

  return (
    <AccessContext.Provider value={value}>
      {children}
      {pending && (
        <ApprovalDialog
          permission={pending.permission}
          subject={pending.subject}
          onApprove={approve}
          onCancel={cancel}
        />
      )}
    </AccessContext.Provider>
  );
}

export function useAccess(): AccessValue {
  const value = useContext(AccessContext);
  if (!value) {
    throw new Error("useAccess вызван вне AccessProvider");
  }
  return value;
}

/**
 * Диалог подтверждения.
 *
 * Подтверждает не обязательно менеджер, а любой, у кого право есть по роли:
 * возврат и чужой заказ кассир подтверждает сам. Требовать перелогина вместо
 * этого нельзя — в зале менеджер один на четыре терминала, и «пусть зайдёт
 * сам» на практике означает, что его PIN знают все официанты.
 */
function ApprovalDialog({
  permission,
  subject,
  onApprove,
  onCancel,
}: {
  permission: Permission;
  subject: string | null;
  onApprove: (pin: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (pin: string) => {
    setError(null);
    try {
      await onApprove(pin);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось подтвердить");
      throw reason;
    }
  };

  return (
    // `fixed`, а не `absolute`: диалог рендерится сиблингом всего терминала,
    // и позиционированного предка у него может не оказаться вовсе.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <div className="space-y-1 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Требуется подтверждение
          </p>
          <h2 className="text-xl font-black text-slate-100">
            {PERMISSION_LABELS[permission]}
          </h2>
          <p className="text-sm text-slate-500">
            {subject ?? "Приложите PIN сотрудника с этим правом"}
          </p>
        </div>

        <PinPad onSubmit={handleSubmit} error={error} />

        <button
          type="button"
          onClick={onCancel}
          className="min-h-14 w-72 rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-slate-300 transition hover:bg-slate-700 active:scale-95"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
