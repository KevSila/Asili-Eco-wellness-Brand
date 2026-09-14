import { DeliveryStatus, OrderSource, OrderStatus, PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../src/server/db/client", () => ({
  prisma: {
    $transaction: prismaMocks.transaction,
  },
}));

import {
  adminService,
  InvalidStatusTransitionError,
} from "../src/server/services/admin";

const currentOrder = {
  id: "order-test-id",
  orderNumber: "ASILI-TEST-STATUS",
  source: OrderSource.WEBSITE,
  customerId: "customer-test-id",
  customerNameSnapshot: "Status Test",
  customerPhoneSnapshot: "+254700000001",
  deliveryArea: "Nairobi",
  customerNote: null,
  currency: "KES",
  subtotalMinor: 60_000,
  deliveryFeeMinor: 0,
  totalAmountMinor: 60_000,
  status: OrderStatus.NEW,
  paymentStatus: PaymentStatus.PENDING,
  deliveryStatus: DeliveryStatus.PENDING,
  createdAt: new Date("2026-09-14T08:00:00.000Z"),
  updatedAt: new Date("2026-09-14T08:00:00.000Z"),
  customer: {
    name: "Status Test",
    phone: "+254700000001",
    normalizedPhone: "+254700000001",
    email: null,
  },
  items: [],
  payments: [],
};

describe("admin status Prisma persistence mapping", () => {
  beforeEach(() => {
    prismaMocks.findUnique.mockReset().mockResolvedValue(currentOrder);
    prismaMocks.update.mockReset().mockImplementation(async ({ data }) => {
      if ("orderStatus" in data) {
        throw new Error("Prisma OrderUpdateInput has no orderStatus field");
      }
      return {
        ...currentOrder,
        status: data.status ?? currentOrder.status,
        paymentStatus: data.paymentStatus ?? currentOrder.paymentStatus,
        deliveryStatus: data.deliveryStatus ?? currentOrder.deliveryStatus,
      };
    });
    prismaMocks.transaction.mockReset().mockImplementation(async (operation) => operation({
      order: {
        findUnique: prismaMocks.findUnique,
        update: prismaMocks.update,
      },
    }));
  });

  it.each([
    ["delivery status", { deliveryStatus: DeliveryStatus.DELIVERED }],
    ["order status", { orderStatus: OrderStatus.DELIVERED }],
  ])("maps synchronized %s completion to the Prisma status field", async (_case, update) => {
    const result = await adminService.updateOrderStatuses(currentOrder.orderNumber, update);

    expect(prismaMocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { orderNumber: currentOrder.orderNumber },
      data: {
        status: OrderStatus.DELIVERED,
        paymentStatus: undefined,
        deliveryStatus: DeliveryStatus.DELIVERED,
      },
    }));
    expect(result.order).toMatchObject({
      orderStatus: "delivered",
      deliveryStatus: "delivered",
    });
    expect(result.changed).toEqual({
      orderStatus: OrderStatus.DELIVERED,
      paymentStatus: undefined,
      deliveryStatus: DeliveryStatus.DELIVERED,
    });
  });

  it("persists delivery scheduling without changing the order status", async () => {
    const result = await adminService.updateOrderStatuses(currentOrder.orderNumber, {
      deliveryStatus: DeliveryStatus.SCHEDULED,
    });

    expect(prismaMocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        status: undefined,
        paymentStatus: undefined,
        deliveryStatus: DeliveryStatus.SCHEDULED,
      },
    }));
    expect(result.order).toMatchObject({
      orderStatus: "new",
      deliveryStatus: "scheduled",
    });
    expect(result.changed).toEqual({
      orderStatus: undefined,
      paymentStatus: undefined,
      deliveryStatus: DeliveryStatus.SCHEDULED,
    });
  });

  it.each([
    [
      "backward delivery movement",
      { ...currentOrder, status: OrderStatus.DELIVERED, deliveryStatus: DeliveryStatus.DELIVERED },
      { deliveryStatus: DeliveryStatus.PENDING },
    ],
    [
      "a delivered order cancellation",
      { ...currentOrder, status: OrderStatus.DELIVERED, deliveryStatus: DeliveryStatus.DELIVERED },
      { orderStatus: OrderStatus.CANCELLED },
    ],
    [
      "movement out of cancellation",
      { ...currentOrder, status: OrderStatus.CANCELLED },
      { orderStatus: OrderStatus.DELIVERED },
    ],
  ])("rejects %s before Prisma update", async (_case, storedOrder, update) => {
    prismaMocks.findUnique.mockResolvedValueOnce(storedOrder);

    await expect(
      adminService.updateOrderStatuses(currentOrder.orderNumber, update),
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
    expect(prismaMocks.update).not.toHaveBeenCalled();
  });

  it("keeps payment status governed by the payment ledger", async () => {
    await expect(
      adminService.updateOrderStatuses(currentOrder.orderNumber, {
        paymentStatus: PaymentStatus.PAID,
      }),
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
    expect(prismaMocks.update).not.toHaveBeenCalled();
  });
});
