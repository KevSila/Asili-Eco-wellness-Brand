import { describe, expect, it } from "vitest";
import { DeliveryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { isAdminStatusUpdateAllowed, synchronizeOperationalStatuses } from "../src/server/services/admin";

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

  it("supports practical independent new-order transitions", () => {
    expect(isAdminStatusUpdateAllowed(current, { orderStatus: OrderStatus.PROCESSING })).toBe(true);
    expect(isAdminStatusUpdateAllowed(current, { paymentStatus: PaymentStatus.PARTIALLY_PAID })).toBe(true);
    expect(isAdminStatusUpdateAllowed(current, { deliveryStatus: DeliveryStatus.DISPATCHED })).toBe(true);
  });

  it.each([OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.DISPATCHED, OrderStatus.DELIVERED])("allows NEW to skip forward to %s", (orderStatus) => {
    expect(isAdminStatusUpdateAllowed(current, { orderStatus })).toBe(true);
  });

  it.each([DeliveryStatus.SCHEDULED, DeliveryStatus.DISPATCHED, DeliveryStatus.DELIVERED])("allows PENDING delivery to skip forward to %s", (deliveryStatus) => {
    expect(isAdminStatusUpdateAllowed(current, { deliveryStatus })).toBe(true);
  });

  it("synchronizes dispatch and delivery in either direction", () => {
    expect(synchronizeOperationalStatuses(current, { deliveryStatus: DeliveryStatus.DISPATCHED })).toEqual({ orderStatus: OrderStatus.DISPATCHED, deliveryStatus: DeliveryStatus.DISPATCHED });
    expect(synchronizeOperationalStatuses(current, { deliveryStatus: DeliveryStatus.DELIVERED })).toEqual({ orderStatus: OrderStatus.DELIVERED, deliveryStatus: DeliveryStatus.DELIVERED });
    expect(synchronizeOperationalStatuses(current, { orderStatus: OrderStatus.DISPATCHED })).toEqual({ orderStatus: OrderStatus.DISPATCHED, deliveryStatus: DeliveryStatus.DISPATCHED });
    expect(synchronizeOperationalStatuses(current, { orderStatus: OrderStatus.DELIVERED })).toEqual({ orderStatus: OrderStatus.DELIVERED, deliveryStatus: DeliveryStatus.DELIVERED });
  });

  it("rejects skipped or backward transitions", () => {
    expect(isAdminStatusUpdateAllowed({ ...current, status: OrderStatus.DELIVERED }, { orderStatus: OrderStatus.NEW })).toBe(false);
    expect(isAdminStatusUpdateAllowed({ ...current, deliveryStatus: DeliveryStatus.DELIVERED }, { deliveryStatus: DeliveryStatus.PENDING })).toBe(false);
  });

  it("keeps delivered and cancelled orders terminal", () => {
    expect(isAdminStatusUpdateAllowed({ ...current, status: OrderStatus.DELIVERED }, { orderStatus: OrderStatus.CANCELLED })).toBe(false);
    expect(isAdminStatusUpdateAllowed({ ...current, status: OrderStatus.CANCELLED }, { orderStatus: OrderStatus.DELIVERED })).toBe(false);
    expect(isAdminStatusUpdateAllowed({ ...current, deliveryStatus: DeliveryStatus.DELIVERED }, { deliveryStatus: DeliveryStatus.DISPATCHED })).toBe(false);
  });
});
