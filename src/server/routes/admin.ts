import { Router } from "express";
import type { RequestHandler } from "express";
import { DeliveryStatus, NotificationType, OrderSource, OrderStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import {
  requireAdminCsrf,
  requireAdminSession,
  type AdminAuthService,
  type AdminSession,
} from "../auth/admin-auth";
import { createAdminLoginRateLimiter } from "../middleware/admin-login-rate-limit";
import {
  adminService,
  AdminOrderNotFoundError,
  InsufficientInventoryError,
  InvalidInventoryAdjustmentError,
  InvalidPaymentError,
  InvalidStatusTransitionError,
  InventoryVariantNotFoundError,
  type AdminService,
} from "../services/admin";
import { normalizeKenyanPhoneNumber } from "../lib/kenyan-phone";
import type { OwnerOrderNotifier } from "../services/order-notification";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(1024),
}).strict();

const statusUpdateSchema = z.object({
  orderStatus: z.enum(["new", "confirmed", "processing", "dispatched", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "partially_paid", "paid", "refunded"]).optional(),
  deliveryStatus: z.enum(["pending", "scheduled", "dispatched", "delivered"]).optional(),
}).strict().refine((value) => Object.values(value).some((item) => item !== undefined));

const optionalText = (maxLength: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(maxLength).optional(),
);

const orderFiltersSchema = z.object({
  search: optionalText(120),
  orderStatus: z.enum(["new", "confirmed", "processing", "dispatched", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "partially_paid", "paid", "refunded"]).optional(),
  deliveryStatus: z.enum(["pending", "scheduled", "dispatched", "delivered"]).optional(),
  source: z.enum(["website", "manual", "whatsapp", "phone", "walk_in"]).optional(),
}).strict();

const inventoryAdjustmentSchema = z.object({
  action: z.enum(["opening_stock", "stock_received", "damage", "correction", "return", "stock_unconfirmed"]),
  quantity: z.number().int().min(0).max(2_147_483_647).optional(),
  stockAfter: z.number().int().min(0).max(2_147_483_647).optional(),
  reason: z.string().trim().min(2).max(500),
}).strict().superRefine((value, context) => {
  if (["opening_stock", "stock_received", "damage", "return"].includes(value.action) && value.quantity === undefined) {
    context.addIssue({ code: "custom", path: ["quantity"], message: "Quantity is required." });
  }
  if (["stock_received", "damage", "return"].includes(value.action) && value.quantity === 0) {
    context.addIssue({ code: "custom", path: ["quantity"], message: "Quantity must be positive." });
  }
  if (value.action === "correction" && value.stockAfter === undefined) {
    context.addIssue({ code: "custom", path: ["stockAfter"], message: "Corrected stock is required." });
  }
});

const optionalPhone = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(40).optional().refine((value) => value === undefined || normalizeKenyanPhoneNumber(value) !== null, "Enter a valid Kenyan mobile number.").transform((value) => value ? normalizeKenyanPhoneNumber(value) as string : undefined),
);

const manualSaleSchema = z.object({
  source: z.enum(["manual", "whatsapp", "phone", "walk_in"]),
  customerName: optionalText(120),
  customerPhone: optionalPhone,
  variantId: z.string().trim().min(1).max(64),
  quantity: z.number().int().positive().max(1000),
  unitPriceMinor: z.number().int().min(0).max(2_147_483_647),
  paymentStatus: z.enum(["pending", "partially_paid", "paid", "refunded"]),
  paymentMethod: z.string().trim().min(2).max(80),
  amountReceivedMinor: z.number().int().min(0).max(2_147_483_647).optional(),
  note: optionalText(1000),
  deliveryLocation: optionalText(240),
}).strict();

const paymentSchema = z.object({
  amountMinor: z.number().int().positive().max(2_147_483_647),
  method: z.string().trim().min(2).max(80),
  reference: optionalText(120),
  notes: optionalText(500),
  paidAt: z.iso.datetime().transform((value) => new Date(value)).optional(),
}).strict();

const orderStatusValues: Record<string, OrderStatus> = {
  new: OrderStatus.NEW,
  confirmed: OrderStatus.CONFIRMED,
  processing: OrderStatus.PROCESSING,
  dispatched: OrderStatus.DISPATCHED,
  delivered: OrderStatus.DELIVERED,
  cancelled: OrderStatus.CANCELLED,
};
const paymentStatusValues: Record<string, PaymentStatus> = {
  pending: PaymentStatus.PENDING,
  partially_paid: PaymentStatus.PARTIALLY_PAID,
  paid: PaymentStatus.PAID,
  refunded: PaymentStatus.REFUNDED,
};
const deliveryStatusValues: Record<string, DeliveryStatus> = {
  pending: DeliveryStatus.PENDING,
  scheduled: DeliveryStatus.SCHEDULED,
  dispatched: DeliveryStatus.DISPATCHED,
  delivered: DeliveryStatus.DELIVERED,
};
const orderSourceValues: Record<string, OrderSource> = {
  website: OrderSource.WEBSITE,
  manual: OrderSource.MANUAL,
  whatsapp: OrderSource.WHATSAPP,
  phone: OrderSource.PHONE,
  walk_in: OrderSource.WALK_IN,
};

function sessionResponse(session: AdminSession) {
  return {
    user: { email: session.email, role: session.role },
    expiresAt: new Date(session.expiresAt).toISOString(),
    csrfToken: session.csrfToken,
  };
}

interface AdminRouterOptions {
  auth: AdminAuthService;
  service?: AdminService;
  loginRateLimiter?: RequestHandler;
  orderNotifier?: OwnerOrderNotifier;
}

export function createAdminRouter(options: AdminRouterOptions) {
  const router = Router();
  const service = options.service ?? adminService;
  const authenticated = requireAdminSession(options.auth);

  router.use((_request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
  });

  router.post("/auth/login", options.loginRateLimiter ?? createAdminLoginRateLimiter(), async (request, response) => {
    if (!options.auth.configured) {
      return response.status(503).json({ error: "Admin access is unavailable.", code: "AUTH_UNAVAILABLE" });
    }
    const credentials = credentialsSchema.safeParse(request.body);
    const session = credentials.success
      ? await options.auth.authenticate(credentials.data.email, credentials.data.password)
      : null;
    if (!session) return response.status(401).json({ error: "Invalid email or password.", code: "INVALID_CREDENTIALS" });
    options.auth.setSessionCookie(response, session);
    return response.json(sessionResponse(session));
  });

  router.get("/auth/session", authenticated, (_request, response) => {
    return response.json(sessionResponse(response.locals.adminSession as AdminSession));
  });

  router.post("/auth/logout", authenticated, requireAdminCsrf(), (_request, response) => {
    options.auth.clearSessionCookie(response);
    return response.status(204).send();
  });

  router.use(authenticated);

  router.get("/dashboard", async (_request, response) => {
    try {
      return response.json(await service.getDashboard());
    } catch (error) {
      console.error("Admin dashboard query failed.", error);
      return response.status(500).json({ error: "Unable to load the dashboard.", code: "ADMIN_QUERY_FAILED" });
    }
  });

  router.get("/orders", async (request, response) => {
    const filters = orderFiltersSchema.safeParse(request.query);
    if (!filters.success) return response.status(400).json({ error: "Invalid order filters.", code: "INVALID_FILTERS" });
    try {
      return response.json(await service.listOrders({
        search: filters.data.search,
        orderStatus: filters.data.orderStatus ? orderStatusValues[filters.data.orderStatus] : undefined,
        paymentStatus: filters.data.paymentStatus ? paymentStatusValues[filters.data.paymentStatus] : undefined,
        deliveryStatus: filters.data.deliveryStatus ? deliveryStatusValues[filters.data.deliveryStatus] : undefined,
        source: filters.data.source ? orderSourceValues[filters.data.source] : undefined,
      }));
    } catch (error) {
      console.error("Admin order list query failed.", error);
      return response.status(500).json({ error: "Unable to load orders.", code: "ADMIN_QUERY_FAILED" });
    }
  });

  router.get("/orders/:orderNumber", async (request, response) => {
    try {
      const order = await service.getOrder(request.params.orderNumber);
      return order
        ? response.json({ order })
        : response.status(404).json({ error: "Order not found.", code: "ORDER_NOT_FOUND" });
    } catch (error) {
      console.error("Admin order query failed.", error);
      return response.status(500).json({ error: "Unable to load the order.", code: "ADMIN_QUERY_FAILED" });
    }
  });

  router.patch("/orders/:orderNumber/statuses", requireAdminCsrf(), async (request, response) => {
    const parsed = statusUpdateSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Invalid status update.", code: "INVALID_STATUS" });
    try {
      const result = await service.updateOrderStatuses(request.params.orderNumber, {
        orderStatus: parsed.data.orderStatus ? orderStatusValues[parsed.data.orderStatus] : undefined,
        paymentStatus: parsed.data.paymentStatus ? paymentStatusValues[parsed.data.paymentStatus] : undefined,
        deliveryStatus: parsed.data.deliveryStatus ? deliveryStatusValues[parsed.data.deliveryStatus] : undefined,
      });
      const notificationTypes = [
        result.changed.deliveryStatus === DeliveryStatus.DISPATCHED ? NotificationType.CUSTOMER_DISPATCHED : null,
        result.changed.deliveryStatus === DeliveryStatus.DELIVERED ? NotificationType.CUSTOMER_DELIVERED : null,
        result.changed.orderStatus === OrderStatus.CANCELLED ? NotificationType.CUSTOMER_CANCELLED : null,
        result.changed.paymentStatus === PaymentStatus.REFUNDED ? NotificationType.CUSTOMER_REFUNDED : null,
      ].filter((type) => type !== null) as NotificationType[];
      for (const notificationType of notificationTypes) {
        try {
          await options.orderNotifier?.notifyCustomerLifecycle?.(result.order as Parameters<NonNullable<OwnerOrderNotifier["notifyCustomerLifecycle"]>>[0], notificationType);
        } catch {
          console.error("Customer order status notification failed.");
        }
      }
      return response.json({ order: result.order });
    } catch (error) {
      if (error instanceof AdminOrderNotFoundError) return response.status(404).json({ error: "Order not found.", code: "ORDER_NOT_FOUND" });
      if (error instanceof InvalidStatusTransitionError) return response.status(409).json({ error: "That status transition is not allowed.", code: "INVALID_STATUS_TRANSITION" });
      console.error("Admin order update failed.", error);
      return response.status(500).json({ error: "Unable to update the order.", code: "ADMIN_UPDATE_FAILED" });
    }
  });

  router.post("/orders/:orderNumber/payments", requireAdminCsrf(), async (request, response) => {
    const parsed = paymentSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Please check the payment details.", code: "INVALID_PAYMENT" });
    try {
      return response.status(201).json({ order: await service.recordPayment(request.params.orderNumber, parsed.data) });
    } catch (error) {
      if (error instanceof AdminOrderNotFoundError) return response.status(404).json({ error: "Order not found.", code: "ORDER_NOT_FOUND" });
      if (error instanceof InvalidPaymentError) return response.status(409).json({ error: error.message, code: "INVALID_PAYMENT" });
      console.error("Admin payment creation failed.", error);
      return response.status(500).json({ error: "Unable to record the payment.", code: "ADMIN_UPDATE_FAILED" });
    }
  });

  router.get("/inventory", async (_request, response) => {
    try {
      return response.json(await service.listInventory());
    } catch (error) {
      console.error("Admin inventory query failed.", error);
      return response.status(500).json({ error: "Unable to load inventory.", code: "ADMIN_QUERY_FAILED" });
    }
  });

  router.post("/inventory/:variantId/movements", requireAdminCsrf(), async (request, response) => {
    const parsed = inventoryAdjustmentSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Invalid inventory adjustment.", code: "INVALID_INVENTORY_ADJUSTMENT" });
    try {
      return response.status(201).json(await service.adjustInventory(request.params.variantId, parsed.data));
    } catch (error) {
      if (error instanceof InventoryVariantNotFoundError) return response.status(404).json({ error: "Product variant not found.", code: "VARIANT_NOT_FOUND" });
      if (error instanceof InsufficientInventoryError) return response.status(409).json({ error: "This adjustment would make stock negative.", code: "INSUFFICIENT_STOCK" });
      if (error instanceof InvalidInventoryAdjustmentError) return response.status(409).json({ error: error.message, code: "INVALID_INVENTORY_ADJUSTMENT" });
      console.error("Admin inventory update failed.", error);
      return response.status(500).json({ error: "Unable to update inventory.", code: "ADMIN_UPDATE_FAILED" });
    }
  });

  router.post("/sales", requireAdminCsrf(), async (request, response) => {
    const parsed = manualSaleSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Please check the sale details.", code: "INVALID_MANUAL_SALE" });
    try {
      const order = await service.recordManualSale({
        ...parsed.data,
        source: orderSourceValues[parsed.data.source] as Exclude<OrderSource, "WEBSITE">,
        paymentStatus: paymentStatusValues[parsed.data.paymentStatus],
      });
      return response.status(201).json({ order });
    } catch (error) {
      if (error instanceof InventoryVariantNotFoundError) return response.status(404).json({ error: "Product variant not found.", code: "VARIANT_NOT_FOUND" });
      if (error instanceof InsufficientInventoryError) return response.status(409).json({ error: "There is not enough known stock for this sale.", code: "INSUFFICIENT_STOCK" });
      if (error instanceof InvalidInventoryAdjustmentError) return response.status(400).json({ error: error.message, code: "INVALID_MANUAL_SALE" });
      if (error instanceof InvalidPaymentError) return response.status(400).json({ error: error.message, code: "INVALID_MANUAL_SALE" });
      console.error("Manual sale creation failed.", error);
      return response.status(500).json({ error: "Unable to record the sale.", code: "ADMIN_UPDATE_FAILED" });
    }
  });

  router.get("/customers", async (_request, response) => {
    try {
      return response.json(await service.listCustomers());
    } catch (error) {
      console.error("Admin customer query failed.", error);
      return response.status(500).json({ error: "Unable to load customers.", code: "ADMIN_QUERY_FAILED" });
    }
  });

  return router;
}
