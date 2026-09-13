import { randomBytes } from "node:crypto";
import {
  DeliveryStatus,
  InventoryMovementSource,
  InventoryMovementType,
  OrderSource,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../db/client";
import { buildSalesSummary, getNairobiPeriodStarts } from "./sales-reporting";

const MAX_POSTGRES_INTEGER = 2_147_483_647;

export interface AdminStatusUpdate {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
}

export interface AdminOrderFilters {
  search?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  source?: OrderSource;
}

export interface InventoryAdjustmentInput {
  action: "opening_stock" | "stock_received" | "damage" | "correction" | "return" | "stock_unconfirmed";
  quantity?: number;
  stockAfter?: number;
  reason: string;
}

export interface ManualSaleInput {
  source: Exclude<OrderSource, "WEBSITE">;
  customerName?: string;
  customerPhone?: string;
  variantId: string;
  quantity: number;
  unitPriceMinor: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  amountReceivedMinor?: number;
  note?: string;
  deliveryLocation?: string;
}

export interface RecordPaymentInput {
  amountMinor: number;
  method: string;
  reference?: string;
  notes?: string;
  paidAt?: Date;
}

export interface StatusUpdateResult {
  order: unknown;
  changed: AdminStatusUpdate;
}

export interface AdminService {
  getDashboard(): Promise<unknown>;
  listOrders(filters?: AdminOrderFilters): Promise<unknown>;
  getOrder(orderNumber: string): Promise<unknown | null>;
  updateOrderStatuses(orderNumber: string, update: AdminStatusUpdate): Promise<StatusUpdateResult>;
  recordPayment(orderNumber: string, input: RecordPaymentInput): Promise<unknown>;
  listInventory(): Promise<unknown>;
  adjustInventory(variantId: string, input: InventoryAdjustmentInput): Promise<unknown>;
  recordManualSale(input: ManualSaleInput): Promise<unknown>;
  listCustomers(): Promise<unknown>;
}

export class AdminOrderNotFoundError extends Error {}
export class InvalidStatusTransitionError extends Error {}
export class InventoryVariantNotFoundError extends Error {}
export class InvalidInventoryAdjustmentError extends Error {}
export class InsufficientInventoryError extends Error {}
export class InvalidPaymentError extends Error {}

const orderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  NEW: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
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
  items: { select: { productNameSnapshot: true, variantNameSnapshot: true, skuSnapshot: true, unitPriceMinor: true, quantity: true, lineTotalMinor: true } },
  payments: { orderBy: { createdAt: "asc" as const }, select: { id: true, method: true, amountMinor: true, currency: true, reference: true, status: true, paidAt: true, notes: true, createdAt: true } },
} satisfies Prisma.OrderInclude;

type AdminOrderRecord = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;
const lower = (value: string) => value.toLowerCase();

export function calculatePaymentBalance(amountDueMinor: number, payments: Array<{ amountMinor: number; status: PaymentStatus }>) {
  const amountReceivedMinor = payments.filter((payment) => payment.status === PaymentStatus.PAID).reduce((total, payment) => total + payment.amountMinor, 0);
  return { amountDueMinor, amountReceivedMinor, balanceMinor: Math.max(0, amountDueMinor - amountReceivedMinor) };
}

function toAdminOrder(order: AdminOrderRecord) {
  const name = order.customer?.name ?? order.customerNameSnapshot ?? "Walk-in customer";
  const phone = order.customer?.normalizedPhone ?? order.customerPhoneSnapshot;
  const paymentBalance = calculatePaymentBalance(order.subtotalMinor + order.deliveryFeeMinor, order.payments);
  const latestPayment = order.payments.at(-1);
  return {
    orderReference: order.orderNumber,
    source: lower(order.source),
    customer: { name, phone, normalizedPhone: phone, email: order.customer?.email ?? null },
    deliveryLocation: order.deliveryArea,
    customerNote: order.customerNote,
    paymentMethod: latestPayment?.method ?? null,
    ...paymentBalance,
    paymentHistory: order.payments.map((payment) => ({
      method: payment.method,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      reference: payment.reference,
      status: lower(payment.status),
      paidAt: payment.paidAt?.toISOString() ?? null,
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
      countedAsReceived: payment.status === PaymentStatus.PAID,
    })),
    currency: order.currency,
    subtotalMinor: order.subtotalMinor,
    deliveryFeeMinor: order.deliveryFeeMinor,
    totalAmountMinor: order.totalAmountMinor,
    orderStatus: lower(order.status),
    paymentStatus: lower(order.paymentStatus),
    deliveryStatus: lower(order.deliveryStatus),
    items: order.items.map((item) => ({ productName: item.productNameSnapshot, variantName: item.variantNameSnapshot, sku: item.skuSnapshot, unitPriceMinor: item.unitPriceMinor, quantity: item.quantity, lineTotalMinor: item.lineTotalMinor })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function createAdminOrderReference() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", year: "2-digit", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "00";
  return `ASILI-M-${part("year")}${part("month")}${part("day")}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function orderWhere(filters: AdminOrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = { status: filters.orderStatus, paymentStatus: filters.paymentStatus, deliveryStatus: filters.deliveryStatus, source: filters.source };
  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: "insensitive" } },
      { customerNameSnapshot: { contains: filters.search, mode: "insensitive" } },
      { customerPhoneSnapshot: { contains: filters.search } },
      { customer: { is: { OR: [{ name: { contains: filters.search, mode: "insensitive" } }, { normalizedPhone: { contains: filters.search } }] } } },
    ];
  }
  return where;
}

async function updateKnownStock(transaction: Prisma.TransactionClient, variantId: string, before: number, after: number) {
  if (after < 0 || after > MAX_POSTGRES_INTEGER) throw new InsufficientInventoryError();
  const update = await transaction.productVariant.updateMany({ where: { id: variantId, stockQuantity: before }, data: { stockQuantity: after } });
  if (update.count !== 1) throw new InvalidInventoryAdjustmentError("Stock changed during this operation. Refresh and try again.");
}

export const adminService: AdminService = {
  async getDashboard() {
    const reportingNow = new Date();
    const reportingStarts = getNairobiPeriodStarts(reportingNow);
    const reportingStart = reportingStarts.week < reportingStarts.month ? reportingStarts.week : reportingStarts.month;
    const [totalOrders, newOrders, confirmedOrders, pendingPayments, pendingDeliveries, recentOrders, recentCustomers, products, reportingOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.NEW } }),
      prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
      prisma.order.count({ where: { deliveryStatus: DeliveryStatus.PENDING } }),
      prisma.order.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: adminOrderInclude }),
      prisma.customer.findMany({ take: 8, orderBy: { createdAt: "desc" }, select: { name: true, normalizedPhone: true, email: true, location: true, createdAt: true, _count: { select: { orders: true } } } }),
      prisma.product.findMany({ where: { active: true, variants: { some: { active: true } } }, orderBy: { name: "asc" }, select: { name: true, slug: true, active: true, variants: { where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, sku: true, active: true, unitPriceMinor: true, currency: true, stockQuantity: true } } } }),
      prisma.order.findMany({ where: { createdAt: { gte: reportingStart }, status: { not: OrderStatus.CANCELLED }, paymentStatus: { not: PaymentStatus.REFUNDED } }, select: { createdAt: true, source: true, paymentStatus: true, subtotalMinor: true, items: { select: { productNameSnapshot: true, variantNameSnapshot: true, skuSnapshot: true, quantity: true } } } }),
    ]);
    return {
      metrics: { totalOrders, newOrders, confirmedOrders, pendingPayments, pendingDeliveries },
      recentOrders: recentOrders.map(toAdminOrder),
      recentCustomers: recentCustomers.map((customer) => ({ name: customer.name ?? "Unnamed customer", phone: customer.normalizedPhone, email: customer.email, location: customer.location, orderCount: customer._count.orders, createdAt: customer.createdAt.toISOString() })),
      products,
      salesSummary: buildSalesSummary(reportingOrders, reportingNow),
    };
  },

  async listOrders(filters = {}) {
    const orders = await prisma.order.findMany({ where: orderWhere(filters), take: 100, orderBy: { createdAt: "desc" }, include: adminOrderInclude });
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
      const changed: AdminStatusUpdate = {
        orderStatus: update.orderStatus !== undefined && update.orderStatus !== current.status ? update.orderStatus : undefined,
        paymentStatus: update.paymentStatus !== undefined && update.paymentStatus !== current.paymentStatus ? update.paymentStatus : undefined,
        deliveryStatus: update.deliveryStatus !== undefined && update.deliveryStatus !== current.deliveryStatus ? update.deliveryStatus : undefined,
      };
      if (!isAdminStatusUpdateAllowed(current, changed)) throw new InvalidStatusTransitionError();
      if (!Object.values(changed).some(Boolean)) return { order: toAdminOrder(current), changed };
      const order = await transaction.order.update({ where: { orderNumber }, data: changed, include: adminOrderInclude });
      return { order: toAdminOrder(order), changed };
    });
  },

  async recordPayment(orderNumber, input) {
    return prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({ where: { orderNumber }, include: adminOrderInclude });
      if (!order) throw new AdminOrderNotFoundError();
      const received = order.payments.filter((payment) => payment.status === PaymentStatus.PAID).reduce((total, payment) => total + payment.amountMinor, 0);
      const amountDue = order.subtotalMinor + order.deliveryFeeMinor;
      if (input.amountMinor <= 0 || received + input.amountMinor > amountDue) throw new InvalidPaymentError("Payment must be positive and cannot exceed the remaining balance.");
      await transaction.payment.create({ data: { orderId: order.id, amountMinor: input.amountMinor, currency: order.currency, method: input.method, reference: input.reference, notes: input.notes, status: PaymentStatus.PAID, paidAt: input.paidAt ?? new Date() } });
      const paymentStatus = received + input.amountMinor === amountDue ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;
      return toAdminOrder(await transaction.order.update({ where: { id: order.id }, data: { paymentStatus }, include: adminOrderInclude }));
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 15_000 });
  },

  async listInventory() {
    const products = await prisma.product.findMany({
      where: { active: true, variants: { some: { active: true } } },
      orderBy: { name: "asc" },
      select: { name: true, variants: { where: { active: true }, orderBy: { name: "asc" }, select: {
        id: true, name: true, sku: true, unitPriceMinor: true, currency: true, stockQuantity: true,
        inventoryMovements: { take: 25, orderBy: { createdAt: "desc" }, select: { type: true, quantityDelta: true, stockBefore: true, stockAfter: true, reason: true, source: true, createdAt: true, order: { select: { orderNumber: true } } } },
      } } },
    });
    return { products };
  },

  async adjustInventory(variantId, input) {
    return prisma.$transaction(async (transaction) => {
      const variant = await transaction.productVariant.findFirst({ where: { id: variantId, active: true, product: { active: true } }, select: { id: true, stockQuantity: true } });
      if (!variant) throw new InventoryVariantNotFoundError();
      const before = variant.stockQuantity;
      let after: number | null;
      let delta: number | null;
      let type: InventoryMovementType;

      if (input.action === "opening_stock") {
        if (before !== null || input.quantity === undefined) throw new InvalidInventoryAdjustmentError("Opening stock can only be set when stock is unconfirmed.");
        after = input.quantity;
        delta = input.quantity;
        type = InventoryMovementType.OPENING_STOCK;
        const update = await transaction.productVariant.updateMany({ where: { id: variantId, stockQuantity: null }, data: { stockQuantity: after } });
        if (update.count !== 1) throw new InvalidInventoryAdjustmentError("Stock changed during this operation. Refresh and try again.");
      } else if (input.action === "stock_unconfirmed") {
        if (before === null) throw new InvalidInventoryAdjustmentError("Stock is already unconfirmed.");
        after = null;
        delta = null;
        type = InventoryMovementType.STOCK_UNCONFIRMED;
        const update = await transaction.productVariant.updateMany({ where: { id: variantId, stockQuantity: before }, data: { stockQuantity: null } });
        if (update.count !== 1) throw new InvalidInventoryAdjustmentError("Stock changed during this operation. Refresh and try again.");
      } else if (input.action === "correction") {
        if (input.stockAfter === undefined) throw new InvalidInventoryAdjustmentError("A corrected stock value is required.");
        after = input.stockAfter;
        delta = before === null ? null : after - before;
        type = InventoryMovementType.CORRECTION;
        if (before === null) {
          const update = await transaction.productVariant.updateMany({ where: { id: variantId, stockQuantity: null }, data: { stockQuantity: after } });
          if (update.count !== 1) throw new InvalidInventoryAdjustmentError("Stock changed during this operation. Refresh and try again.");
        } else await updateKnownStock(transaction, variantId, before, after);
      } else {
        if (before === null || input.quantity === undefined) throw new InvalidInventoryAdjustmentError("Set opening stock before adjusting a known quantity.");
        const positive = input.action === "stock_received" || input.action === "return";
        delta = positive ? input.quantity : -input.quantity;
        after = before + delta;
        type = input.action === "stock_received" ? InventoryMovementType.STOCK_RECEIVED : input.action === "return" ? InventoryMovementType.RETURN : InventoryMovementType.DAMAGE;
        await updateKnownStock(transaction, variantId, before, after);
      }

      if (after !== null && (after < 0 || after > MAX_POSTGRES_INTEGER)) throw new InsufficientInventoryError();
      const movement = await transaction.inventoryMovement.create({ data: { productVariantId: variantId, type, quantityDelta: delta, stockBefore: before, stockAfter: after, reason: input.reason, source: InventoryMovementSource.ADMIN } });
      return { variantId, stockQuantity: after, movement: { ...movement, type: lower(movement.type), source: lower(movement.source) } };
    });
  },

  async recordManualSale(input) {
    return prisma.$transaction(async (transaction) => {
      const variant = await transaction.productVariant.findFirst({ where: { id: input.variantId, active: true, product: { active: true } }, select: { id: true, name: true, sku: true, currency: true, stockQuantity: true, product: { select: { name: true } } } });
      if (!variant) throw new InventoryVariantNotFoundError();
      const lineTotalMinor = input.unitPriceMinor * input.quantity;
      if (!Number.isSafeInteger(lineTotalMinor) || lineTotalMinor > MAX_POSTGRES_INTEGER) throw new InvalidInventoryAdjustmentError("Sale total is outside the supported range.");

      let customerId: string | undefined;
      if (input.customerPhone) {
        const customer = await transaction.customer.upsert({ where: { normalizedPhone: input.customerPhone }, update: { name: input.customerName, phone: input.customerPhone, location: input.deliveryLocation }, create: { name: input.customerName, phone: input.customerPhone, normalizedPhone: input.customerPhone, location: input.deliveryLocation } });
        customerId = customer.id;
      } else if (input.customerName) {
        customerId = (await transaction.customer.create({ data: { name: input.customerName, location: input.deliveryLocation } })).id;
      }

      const amountReceivedMinor = input.amountReceivedMinor ?? (input.paymentStatus === PaymentStatus.PAID ? lineTotalMinor : 0);
      if (input.paymentStatus === PaymentStatus.PARTIALLY_PAID && input.amountReceivedMinor === undefined) throw new InvalidPaymentError("Enter the amount actually received for a partial payment.");
      if (amountReceivedMinor < 0 || amountReceivedMinor > lineTotalMinor) throw new InvalidPaymentError("Amount received cannot exceed the sale total.");
      const paymentStatus = amountReceivedMinor === 0 ? PaymentStatus.PENDING : amountReceivedMinor === lineTotalMinor ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;
      const order = await transaction.order.create({
        data: {
          orderNumber: createAdminOrderReference(), source: input.source, customerId, customerNameSnapshot: input.customerName, customerPhoneSnapshot: input.customerPhone,
          status: OrderStatus.CONFIRMED, paymentStatus, deliveryStatus: input.deliveryLocation ? DeliveryStatus.PENDING : DeliveryStatus.DELIVERED,
          currency: variant.currency, subtotalMinor: lineTotalMinor, totalAmountMinor: lineTotalMinor, deliveryArea: input.deliveryLocation, customerNote: input.note,
          items: { create: { productVariantId: variant.id, productNameSnapshot: variant.product.name, variantNameSnapshot: variant.name, skuSnapshot: variant.sku, unitPriceMinor: input.unitPriceMinor, quantity: input.quantity, lineTotalMinor } },
          payments: amountReceivedMinor > 0 ? { create: { method: input.paymentMethod, amountMinor: amountReceivedMinor, currency: variant.currency, status: PaymentStatus.PAID, paidAt: new Date() } } : undefined,
        },
        include: adminOrderInclude,
      });

      let stockAfter = variant.stockQuantity;
      if (variant.stockQuantity !== null) {
        stockAfter = variant.stockQuantity - input.quantity;
        await updateKnownStock(transaction, variant.id, variant.stockQuantity, stockAfter);
      }
      await transaction.inventoryMovement.create({ data: { productVariantId: variant.id, orderId: order.id, type: InventoryMovementType.MANUAL_SALE, quantityDelta: -input.quantity, stockBefore: variant.stockQuantity, stockAfter, reason: `Manual sale ${order.orderNumber}`, source: InventoryMovementSource.MANUAL_SALE } });
      return toAdminOrder(order);
    }, { maxWait: 10_000, timeout: 15_000 });
  },

  async listCustomers() {
    const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { name: true, normalizedPhone: true, email: true, orders: { orderBy: { createdAt: "desc" }, select: { subtotalMinor: true, createdAt: true, source: true } } } });
    return { customers: customers.map((customer) => ({ name: customer.name ?? "Unnamed customer", phone: customer.normalizedPhone, email: customer.email, orderCount: customer.orders.length, totalProductSpendMinor: customer.orders.reduce((total, order) => total + order.subtotalMinor, 0), lastOrderAt: customer.orders[0]?.createdAt.toISOString() ?? null, latestOrderSource: customer.orders[0] ? lower(customer.orders[0].source) : null })) };
  },
};
