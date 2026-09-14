import { createHash, randomBytes } from "node:crypto";
import {
  Prisma,
  InventoryMovementSource,
  InventoryMovementType,
  OrderSource,
  type DeliveryStatus,
  type OrderStatus,
  type PaymentStatus,
} from "@prisma/client";
import { prisma } from "../db/client";
import { resolveHistoricalOrderCustomer } from "../lib/order-customer-snapshot";

const MAX_POSTGRES_INTEGER = 2_147_483_647;
const ORDER_REFERENCE_ATTEMPTS = 3;

export interface PublicVariant {
  id: string;
  sku: string;
  name: string;
  priceMinor: number;
  currency: string;
  availableStock: number | null;
}

export interface PublicProduct {
  slug: string;
  name: string;
  description: string | null;
  variants: PublicVariant[];
}

export interface CreateOrderInput {
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  deliveryLocation: string;
  customerNote?: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
}

export interface PublicOrder {
  orderReference: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  currency: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalAmountMinor: number;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  deliveryLocation: string;
  customerNote: string | null;
  items: Array<{
    sku: string | null;
    productName: string;
    variantName: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }>;
}

export interface CreateOrderOptions {
  idempotencyKey: string;
}

export interface CreateOrderResult {
  order: PublicOrder;
  replayed: boolean;
}

export interface BusinessService {
  listProducts(): Promise<PublicProduct[]>;
  getProductBySlug(slug: string): Promise<PublicProduct | null>;
  createOrder(input: CreateOrderInput, options: CreateOrderOptions): Promise<CreateOrderResult>;
}

export class ProductUnavailableError extends Error {
  constructor() {
    super("One or more products are unavailable.");
    this.name = "ProductUnavailableError";
  }
}

export class InsufficientStockError extends Error {
  constructor() {
    super("There is not enough stock to complete this order.");
    this.name = "InsufficientStockError";
  }
}

export class MixedCurrencyError extends Error {
  constructor() {
    super("All order items must use the same currency.");
    this.name = "MixedCurrencyError";
  }
}

export class InvalidOrderTotalError extends Error {
  constructor() {
    super("The calculated order total is outside the supported range.");
    this.name = "InvalidOrderTotalError";
  }
}

export class IdempotencyConflictError extends Error {
  constructor() {
    super("This submission key has already been used for different order details.");
    this.name = "IdempotencyConflictError";
  }
}

const publicProductSelection = {
  slug: true,
  name: true,
  description: true,
  variants: {
    where: { active: true },
    orderBy: { name: "asc" as const },
    select: {
      id: true,
      sku: true,
      name: true,
      unitPriceMinor: true,
      currency: true,
      stockQuantity: true,
    },
  },
};

function toPublicProduct(product: {
  slug: string;
  name: string;
  description: string | null;
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    unitPriceMinor: number;
    currency: string;
    stockQuantity: number | null;
  }>;
}): PublicProduct {
  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      priceMinor: variant.unitPriceMinor,
      currency: variant.currency,
      availableStock: variant.stockQuantity,
    })),
  };
}

function nairobiDateStamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${value("year")}${value("month")}${value("day")}`;
}

function createOrderReference() {
  const configuredPrefix = process.env.ORDER_REFERENCE_PREFIX?.trim().toUpperCase();
  const prefix = configuredPrefix && /^[A-Z0-9]{2,10}$/.test(configuredPrefix)
    ? configuredPrefix
    : "ASILI";
  const randomSuffix = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${nairobiDateStamp()}-${randomSuffix}`;
}

function statusValue(status: OrderStatus | PaymentStatus | DeliveryStatus) {
  return status.toLowerCase();
}

function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && (error.code === "P2002" || error.code === "P2034");
}

const publicOrderInclude = {
  customer: { select: { name: true, phone: true, email: true } },
  items: true,
} satisfies Prisma.OrderInclude;

type PublicOrderRecord = Prisma.OrderGetPayload<{ include: typeof publicOrderInclude }>;

function toPublicOrder(order: PublicOrderRecord): PublicOrder {
  const historicalCustomer = resolveHistoricalOrderCustomer({
    customerNameSnapshot: order.customerNameSnapshot,
    customerPhoneSnapshot: order.customerPhoneSnapshot,
    currentName: order.customer?.name,
    currentPhone: order.customer?.phone,
  });
  return {
    orderReference: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: statusValue(order.status),
    paymentStatus: statusValue(order.paymentStatus),
    deliveryStatus: statusValue(order.deliveryStatus),
    currency: order.currency,
    subtotalMinor: order.subtotalMinor,
    deliveryFeeMinor: order.deliveryFeeMinor,
    totalAmountMinor: order.totalAmountMinor,
    customer: {
      name: historicalCustomer.name,
      phone: historicalCustomer.phone ?? "",
      email: order.customer?.email ?? null,
    },
    deliveryLocation: order.deliveryArea ?? "",
    customerNote: order.customerNote,
    items: order.items.map((item) => ({
      sku: item.skuSnapshot,
      productName: item.productNameSnapshot,
      variantName: item.variantNameSnapshot,
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      lineTotalMinor: item.lineTotalMinor,
    })),
  };
}

function createIdempotencyFingerprint(input: CreateOrderInput) {
  const canonicalInput = {
    customer: input.customer,
    deliveryLocation: input.deliveryLocation,
    customerNote: input.customerNote ?? null,
    items: [...input.items].sort((left, right) => left.variantId.localeCompare(right.variantId)),
  };
  return createHash("sha256").update(JSON.stringify(canonicalInput)).digest("hex");
}

async function findIdempotentOrder(idempotencyKey: string, fingerprint: string) {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey },
    include: publicOrderInclude,
  });
  if (!existing) return null;
  if (existing.idempotencyFingerprint !== fingerprint) throw new IdempotencyConflictError();
  return { order: toPublicOrder(existing), replayed: true };
}

export const businessService: BusinessService = {
  async listProducts() {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        variants: { some: { active: true } },
      },
      orderBy: { name: "asc" },
      select: publicProductSelection,
    });

    return products.map(toPublicProduct);
  },

  async getProductBySlug(slug) {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        active: true,
        variants: { some: { active: true } },
      },
      select: publicProductSelection,
    });

    return product ? toPublicProduct(product) : null;
  },

  async createOrder(input, options) {
    const fingerprint = createIdempotencyFingerprint(input);
    const priorResult = await findIdempotentOrder(options.idempotencyKey, fingerprint);
    if (priorResult) return priorResult;

    for (let attempt = 1; attempt <= ORDER_REFERENCE_ATTEMPTS; attempt += 1) {
      const orderReference = createOrderReference();

      try {
        return await prisma.$transaction(async (transaction) => {
          const requestedItems = [...input.items].sort((left, right) =>
            left.variantId.localeCompare(right.variantId),
          );
          const variants = await transaction.productVariant.findMany({
            where: { id: { in: requestedItems.map((item) => item.variantId) } },
            select: {
              id: true,
              name: true,
              sku: true,
              unitPriceMinor: true,
              currency: true,
              stockQuantity: true,
              active: true,
              product: {
                select: { name: true, active: true },
              },
            },
          });

          const variantsById = new Map(variants.map((variant) => [variant.id, variant]));
          const lineItems = requestedItems.map((item) => {
            const variant = variantsById.get(item.variantId);
            if (!variant?.active || !variant.product.active) {
              throw new ProductUnavailableError();
            }

            const lineTotalMinor = variant.unitPriceMinor * item.quantity;
            if (!Number.isSafeInteger(lineTotalMinor) || lineTotalMinor > MAX_POSTGRES_INTEGER) {
              throw new InvalidOrderTotalError();
            }

            return { ...item, variant, lineTotalMinor };
          });

          const currencies = new Set(lineItems.map((item) => item.variant.currency));
          if (currencies.size !== 1) {
            throw new MixedCurrencyError();
          }

          const subtotalMinor = lineItems.reduce((total, item) => total + item.lineTotalMinor, 0);
          if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor > MAX_POSTGRES_INTEGER) {
            throw new InvalidOrderTotalError();
          }

          const customer = await transaction.customer.upsert({
            where: { normalizedPhone: input.customer.phone },
            update: {
              name: input.customer.name,
              phone: input.customer.phone,
              email: input.customer.email,
              location: input.deliveryLocation,
            },
            create: {
              name: input.customer.name,
              phone: input.customer.phone,
              normalizedPhone: input.customer.phone,
              email: input.customer.email,
              location: input.deliveryLocation,
            },
          });

          const order = await transaction.order.create({
            data: {
              orderNumber: orderReference,
              source: OrderSource.WEBSITE,
              idempotencyKey: options.idempotencyKey,
              idempotencyFingerprint: fingerprint,
              customerId: customer.id,
              customerNameSnapshot: input.customer.name,
              customerPhoneSnapshot: input.customer.phone,
              currency: lineItems[0].variant.currency,
              subtotalMinor,
              totalAmountMinor: subtotalMinor,
              deliveryArea: input.deliveryLocation,
              customerNote: input.customerNote,
              items: {
                create: lineItems.map((item) => ({
                  productVariantId: item.variant.id,
                  productNameSnapshot: item.variant.product.name,
                  variantNameSnapshot: item.variant.name,
                  skuSnapshot: item.variant.sku,
                  unitPriceMinor: item.variant.unitPriceMinor,
                  quantity: item.quantity,
                  lineTotalMinor: item.lineTotalMinor,
                })),
              },
            },
            include: publicOrderInclude,
          });

          for (const item of lineItems) {
            if (item.variant.stockQuantity === null) continue;
            const stockUpdate = await transaction.productVariant.updateMany({
              where: {
                id: item.variantId,
                active: true,
                stockQuantity: { gte: item.quantity },
                product: { active: true },
              },
              data: { stockQuantity: { decrement: item.quantity } },
            });

            if (stockUpdate.count !== 1) throw new InsufficientStockError();
            const updatedVariant = await transaction.productVariant.findUniqueOrThrow({
              where: { id: item.variantId },
              select: { stockQuantity: true },
            });
            const stockAfter = updatedVariant.stockQuantity as number;
            await transaction.inventoryMovement.create({
              data: {
                productVariantId: item.variantId,
                orderId: order.id,
                type: InventoryMovementType.ONLINE_SALE,
                quantityDelta: -item.quantity,
                stockBefore: stockAfter + item.quantity,
                stockAfter,
                reason: `Website order ${order.orderNumber}`,
                source: InventoryMovementSource.WEBSITE_ORDER,
              },
            });
          }

          return { order: toPublicOrder(order), replayed: false };
        }, {
          maxWait: 10_000,
          timeout: 15_000,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const replay = await findIdempotentOrder(options.idempotencyKey, fingerprint);
          if (replay) return replay;
        }
        if (attempt < ORDER_REFERENCE_ATTEMPTS && isRetryableTransactionError(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new Error("Unable to allocate an order reference.");
  },
};
