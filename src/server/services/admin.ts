import {
  DeliveryStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../db/client";

export interface AdminStatusUpdate {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
}

export interface AdminService {
  getDashboard(): Promise<unknown>;
  listOrders(): Promise<unknown>;
  getOrder(orderNumber: string): Promise<unknown | null>;
  updateOrderStatuses(orderNumber: string, update: AdminStatusUpdate): Promise<unknown>;
}

export class AdminOrderNotFoundError extends Error {}
export class InvalidStatusTransitionError extends Error {}

const orderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  NEW: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
  DISPATCHED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

const paymentTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: [PaymentStatus.PARTIALLY_PAID, PaymentStatus.PAID],
  PARTIALLY_PAID: [PaymentStatus.PAID, PaymentStatus.REFUNDED],
  PAID: [PaymentStatus.REFUNDED],
  REFUNDED: [],
};

const deliveryTransitions: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  PENDING: [DeliveryStatus.SCHEDULED, DeliveryStatus.DISPATCHED],
  SCHEDULED: [DeliveryStatus.DISPATCHED],
  DISPATCHED: [DeliveryStatus.DELIVERED],
  DELIVERED: [],
};

function canTransition<T extends string>(current: T, next: T | undefined, allowed: Record<T, readonly T[]>) {
  return next === undefined || next === current || allowed[current].includes(next);
}

export function isAdminStatusUpdateAllowed(
  current: { status: OrderStatus; paymentStatus: PaymentStatus; deliveryStatus: DeliveryStatus },
  update: AdminStatusUpdate,
) {
  return canTransition(current.status, update.orderStatus, orderTransitions)
    && canTransition(current.paymentStatus, update.paymentStatus, paymentTransitions)
    && canTransition(current.deliveryStatus, update.deliveryStatus, deliveryTransitions);
}

const adminOrderInclude = {
  customer: { select: { name: true, phone: true, normalizedPhone: true, email: true } },
  items: {
    select: {
      productNameSnapshot: true,
      variantNameSnapshot: true,
      skuSnapshot: true,
      unitPriceMinor: true,
      quantity: true,
      lineTotalMinor: true,
    },
  },
} satisfies Prisma.OrderInclude;

type AdminOrderRecord = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;

function status(value: string) {
  return value.toLowerCase();
}

function toAdminOrder(order: AdminOrderRecord) {
  return {
    orderReference: order.orderNumber,
    customer: order.customer,
    deliveryLocation: order.deliveryArea,
    customerNote: order.customerNote,
    currency: order.currency,
    subtotalMinor: order.subtotalMinor,
    deliveryFeeMinor: order.deliveryFeeMinor,
    totalAmountMinor: order.totalAmountMinor,
    orderStatus: status(order.status),
    paymentStatus: status(order.paymentStatus),
    deliveryStatus: status(order.deliveryStatus),
    items: order.items.map((item) => ({
      productName: item.productNameSnapshot,
      variantName: item.variantNameSnapshot,
      sku: item.skuSnapshot,
      unitPriceMinor: item.unitPriceMinor,
      quantity: item.quantity,
      lineTotalMinor: item.lineTotalMinor,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export const adminService: AdminService = {
  async getDashboard() {
    const [totalOrders, newOrders, confirmedOrders, pendingPayments, pendingDeliveries, recentOrders, recentCustomers, products] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.NEW } }),
      prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
      prisma.order.count({ where: { deliveryStatus: DeliveryStatus.PENDING } }),
      prisma.order.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: adminOrderInclude }),
      prisma.customer.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: { name: true, normalizedPhone: true, email: true, location: true, createdAt: true, _count: { select: { orders: true } } },
      }),
      prisma.product.findMany({
        orderBy: { name: "asc" },
        select: {
          name: true,
          slug: true,
          active: true,
          variants: { orderBy: { name: "asc" }, select: { name: true, sku: true, active: true, unitPriceMinor: true, currency: true, stockQuantity: true } },
        },
      }),
    ]);

    return {
      metrics: { totalOrders, newOrders, confirmedOrders, pendingPayments, pendingDeliveries },
      recentOrders: recentOrders.map(toAdminOrder),
      recentCustomers: recentCustomers.map((customer) => ({
        name: customer.name,
        phone: customer.normalizedPhone,
        email: customer.email,
        location: customer.location,
        orderCount: customer._count.orders,
        createdAt: customer.createdAt.toISOString(),
      })),
      products,
    };
  },

  async listOrders() {
    const orders = await prisma.order.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: adminOrderInclude });
    return { orders: orders.map(toAdminOrder) };
  },

  async getOrder(orderNumber) {
    const order = await prisma.order.findUnique({ where: { orderNumber }, include: adminOrderInclude });
    return order ? toAdminOrder(order) : null;
  },

  async updateOrderStatuses(orderNumber, update) {
    return prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({ where: { orderNumber }, include: adminOrderInclude });
      if (!current) throw new AdminOrderNotFoundError();
      if (!isAdminStatusUpdateAllowed(current, update)) throw new InvalidStatusTransitionError();

      const updated = await transaction.order.update({
        where: { orderNumber },
        data: update,
        include: adminOrderInclude,
      });
      return toAdminOrder(updated);
    });
  },
};
