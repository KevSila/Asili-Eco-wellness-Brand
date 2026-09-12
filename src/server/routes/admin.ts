import { Router } from "express";
import type { RequestHandler } from "express";
import { DeliveryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
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
  InvalidStatusTransitionError,
  type AdminService,
} from "../services/admin";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(1024),
}).strict();

const statusUpdateSchema = z.object({
  orderStatus: z.enum(["new", "confirmed", "processing", "dispatched", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "partially_paid", "paid", "refunded"]).optional(),
  deliveryStatus: z.enum(["pending", "scheduled", "dispatched", "delivered"]).optional(),
}).strict().refine((value) => Object.values(value).some((item) => item !== undefined));

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

  router.get("/orders", async (_request, response) => {
    try {
      return response.json(await service.listOrders());
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
      const order = await service.updateOrderStatuses(request.params.orderNumber, {
        orderStatus: parsed.data.orderStatus ? orderStatusValues[parsed.data.orderStatus] : undefined,
        paymentStatus: parsed.data.paymentStatus ? paymentStatusValues[parsed.data.paymentStatus] : undefined,
        deliveryStatus: parsed.data.deliveryStatus ? deliveryStatusValues[parsed.data.deliveryStatus] : undefined,
      });
      return response.json({ order });
    } catch (error) {
      if (error instanceof AdminOrderNotFoundError) return response.status(404).json({ error: "Order not found.", code: "ORDER_NOT_FOUND" });
      if (error instanceof InvalidStatusTransitionError) return response.status(409).json({ error: "That status transition is not allowed.", code: "INVALID_STATUS_TRANSITION" });
      console.error("Admin order update failed.", error);
      return response.status(500).json({ error: "Unable to update the order.", code: "ADMIN_UPDATE_FAILED" });
    }
  });

  return router;
}
