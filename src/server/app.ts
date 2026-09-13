import express from "express";
import type { RequestHandler } from "express";
import path from "node:path";
import { createContactRouter } from "./routes/contact";
import { createHealthRouter } from "./routes/health";
import type { DatabaseReadinessCheck } from "./services/database-readiness";
import { createOrdersRouter } from "./routes/orders";
import { createProductsRouter } from "./routes/products";
import type { BusinessService } from "./services/business";
import { createOrderRateLimiter } from "./middleware/order-rate-limit";
import { createAdminAuthFromEnvironment, type AdminAuthService } from "./auth/admin-auth";
import { createAdminRouter } from "./routes/admin";
import type { AdminService } from "./services/admin";
import { createOwnerOrderNotifier, type OwnerOrderNotifier } from "./services/order-notification";

interface CreateAppOptions {
  serveFrontend?: boolean;
  resendApiKey?: string;
  contactFromEmail?: string;
  contactToEmail?: string;
  databaseReadinessCheck?: DatabaseReadinessCheck;
  businessService?: BusinessService;
  orderRateLimiter?: RequestHandler;
  adminAuth?: AdminAuthService;
  adminService?: AdminService;
  adminLoginRateLimiter?: RequestHandler;
  orderNotifier?: OwnerOrderNotifier;
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const serveFrontend = options.serveFrontend ?? true;
  const orderNotifier = options.orderNotifier ?? createOwnerOrderNotifier({
    resendApiKey: options.resendApiKey ?? process.env.RESEND_API_KEY,
    fromEmail: options.contactFromEmail ?? process.env.CONTACT_FROM_EMAIL,
    toEmail: process.env.ORDER_NOTIFICATION_TO_EMAIL || options.contactToEmail || process.env.CONTACT_TO_EMAIL,
    adminUrl: process.env.ADMIN_PUBLIC_URL,
  });

  app.disable("x-powered-by");
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.use(express.json({ limit: "20kb" }));
  app.use(
    "/api/health",
    createHealthRouter({ databaseReadinessCheck: options.databaseReadinessCheck }),
  );
  app.use(
    "/api/contact",
    createContactRouter({
      resendApiKey: options.resendApiKey ?? process.env.RESEND_API_KEY,
      fromEmail: options.contactFromEmail ?? process.env.CONTACT_FROM_EMAIL,
      toEmail: options.contactToEmail ?? process.env.CONTACT_TO_EMAIL,
    }),
  );
  app.use("/api/products", createProductsRouter(options.businessService));
  app.use(
    "/api/orders",
    options.orderRateLimiter ?? createOrderRateLimiter(),
    createOrdersRouter(
      options.businessService,
      orderNotifier,
    ),
  );
  app.use(
    "/api/admin",
    createAdminRouter({
      auth: options.adminAuth ?? createAdminAuthFromEnvironment(),
      service: options.adminService,
      loginRateLimiter: options.adminLoginRateLimiter,
      orderNotifier,
    }),
  );

  if (!serveFrontend) {
    return app;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const page = req.path === "/honey" || req.path.startsWith("/honey/")
        ? path.join(distPath, "honey", "index.html")
        : req.path === "/admin" || req.path.startsWith("/admin/")
          ? path.join(distPath, "admin", "index.html")
          : path.join(distPath, "index.html");
      res.sendFile(page);
    });
  }

  return app;
}
