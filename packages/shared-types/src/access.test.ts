import { describe, expect, it } from "vitest";
import {
  CONTRACT_PERMISSIONS,
  CONTRACT_ROLES,
  OVERRIDABLE_PERMISSIONS,
  ROLE_PERMISSIONS,
  canApprove,
  isOverridable,
  permissionsOf,
} from "./access";
import type { StaffRole } from "./common";

/**
 * Матрица прав. Тесты закрепляют не список, а правила, из-за которых он
 * такой: расхождение здесь — это дыра в доступе, а не косметика.
 */

describe("согласованность с контрактом", () => {
  it("все права ролей объявлены в контракте", () => {
    for (const role of CONTRACT_ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(CONTRACT_PERMISSIONS).toContain(permission);
      }
    }
  });

  it("у каждой роли описан свой набор", () => {
    for (const role of CONTRACT_ROLES) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it("подтверждаемые права — подмножество всех", () => {
    for (const permission of OVERRIDABLE_PERMISSIONS) {
      expect(CONTRACT_PERMISSIONS).toContain(permission);
    }
  });

  it("ни у одной роли нет дублей", () => {
    for (const role of CONTRACT_ROLES) {
      const list = ROLE_PERMISSIONS[role];
      expect(new Set(list).size).toBe(list.length);
    }
  });
});

describe("официант и кассир", () => {
  const waiter = permissionsOf("waiter");
  const cashier = permissionsOf("cashier");

  it("оба принимают оплату — сдачу выдаёт и официант", () => {
    expect(waiter.has("payment.accept")).toBe(true);
    expect(cashier.has("payment.accept")).toBe(true);
  });

  it("оба заводят заказ и отправляют на кухню", () => {
    for (const permission of ["order.create", "order.item.add", "order.send"] as const) {
      expect(waiter.has(permission)).toBe(true);
      expect(cashier.has(permission)).toBe(true);
    }
  });

  it("денежный ящик и смена — только у кассира", () => {
    for (const permission of ["cash.drawer", "shift.open", "shift.close"] as const) {
      expect(waiter.has(permission)).toBe(false);
      expect(cashier.has(permission)).toBe(true);
    }
  });

  it("чужой заказ и возврат официанту не свои", () => {
    expect(waiter.has("order.foreign")).toBe(false);
    expect(waiter.has("payment.refund")).toBe(false);
    expect(cashier.has("order.foreign")).toBe(true);
  });
});

describe("роль support", () => {
  it("имеет ровно одно право", () => {
    // Инженер вендора с правом сторно в чужой кассе — это дыра,
    // а не удобство.
    expect([...permissionsOf("support")]).toEqual(["terminal.service"]);
  });

  it("сервисное право не выдано никому другому", () => {
    for (const role of CONTRACT_ROLES) {
      if (role === "support") continue;
      expect(permissionsOf(role).has("terminal.service")).toBe(false);
    }
  });
});

describe("повар", () => {
  const cook = permissionsOf("cook");

  it("видит кухню и правит стоп-лист", () => {
    expect(cook.has("kitchen.view")).toBe(true);
    expect(cook.has("menu.stoplist")).toBe(true);
  });

  it("не видит ни заказов, ни денег", () => {
    expect(cook.has("order.view")).toBe(false);
    expect(cook.has("payment.accept")).toBe(false);
  });
});

describe("подтверждение старшим", () => {
  it("менеджер подтверждает сторно и отмену", () => {
    expect(canApprove("manager", "order.item.void")).toBe(true);
    expect(canApprove("manager", "order.cancel")).toBe(true);
  });

  it("кассир подтверждает возврат и чужой заказ сам", () => {
    // Требовать для этого менеджера значило бы гонять его по залу.
    expect(canApprove("cashier", "payment.refund")).toBe(true);
    expect(canApprove("cashier", "order.foreign")).toBe(true);
  });

  it("официант не подтверждает ничего", () => {
    for (const permission of OVERRIDABLE_PERMISSIONS) {
      expect(canApprove("waiter", permission)).toBe(false);
    }
  });

  it("неподтверждаемое право не подтверждает даже менеджер", () => {
    // Цепочка «подтвердил тем, чего сам не может» невозможна по построению.
    expect(isOverridable("order.view")).toBe(false);
    expect(canApprove("manager", "order.view")).toBe(false);
  });

  it("подтверждающий обязан иметь право по роли", () => {
    for (const role of CONTRACT_ROLES as readonly StaffRole[]) {
      for (const permission of OVERRIDABLE_PERMISSIONS) {
        if (canApprove(role, permission)) {
          expect(permissionsOf(role).has(permission)).toBe(true);
        }
      }
    }
  });
});

describe("менеджер", () => {
  it("может всё, кроме сервисного экрана", () => {
    const manager = permissionsOf("manager");
    for (const permission of CONTRACT_PERMISSIONS) {
      if (permission === "terminal.service") continue;
      expect(manager.has(permission)).toBe(true);
    }
  });
});
