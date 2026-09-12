import { describe, expect, it } from "vitest";
import { DeliveryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { isAdminStatusUpdateAllowed } from "../src/server/services/admin";

const current = {
  status: OrderStatus.NEW,
  paymentStatus: PaymentStatus.PENDING,
  deliveryStatus: DeliveryStatus.PENDING,
};

describe("admin order status transitions", () => {
  it("allows expected forward transitions", () => {
    expect(isAdminStatusUpdateAllowed(current, {
      orderStatus: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.SCHEDULED,
    })).toBe(true);
  });

  it("allows a status to remain unchanged", () => {
    expect(isAdminStatusUpdateAllowed(current, {
      orderStatus: OrderStatus.NEW,
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.PENDING,
    })).toBe(true);
  });

  it("rejects skipped or backward transitions", () => {
    expect(isAdminStatusUpdateAllowed(current, { orderStatus: OrderStatus.DELIVERED })).toBe(false);
    expect(isAdminStatusUpdateAllowed({ ...current, status: OrderStatus.DELIVERED }, { orderStatus: OrderStatus.NEW })).toBe(false);
    expect(isAdminStatusUpdateAllowed({ ...current, deliveryStatus: DeliveryStatus.DELIVERED }, { deliveryStatus: DeliveryStatus.PENDING })).toBe(false);
  });
});
