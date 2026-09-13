import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DeliveryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { createApp } from "../src/server/app";
import { createAdminAuth, createAdminPasswordHash } from "../src/server/auth/admin-auth";
import { createAdminLoginRateLimiter } from "../src/server/middleware/admin-login-rate-limit";
import type { AdminService } from "../src/server/services/admin";
import type { OwnerOrderNotifier } from "../src/server/services/order-notification";

const ADMIN_EMAIL = "owner@example.com";
const ADMIN_PASSWORD = "correct horse battery staple";
const SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
let passwordHash = "";

const sampleOrder = {
  orderReference: "ASILI-260912-TEST01",
  customer: { name: "Test Customer", phone: "+254712345678", normalizedPhone: "+254712345678", email: "test@example.com" },
  deliveryLocation: "Nairobi",
  customerNote: "Test note",
  currency: "KES",
  subtotalMinor: 60000,
  deliveryFeeMinor: 0,
  totalAmountMinor: 60000,
  orderStatus: "new",
  paymentStatus: "pending",
  deliveryStatus: "pending",
  items: [{ productName: "Asili Raw Makueni Honey", variantName: "500g", sku: "ASILI-HONEY-500G", unitPriceMinor: 60000, quantity: 1, lineTotalMinor: 60000 }],
  createdAt: "2026-09-12T10:00:00.000Z",
  updatedAt: "2026-09-12T10:00:00.000Z",
};

beforeAll(async () => {
  passwordHash = await createAdminPasswordHash(ADMIN_PASSWORD);
});

function createMockService() {
  return {
    getDashboard: vi.fn().mockResolvedValue({
      metrics: { totalOrders: 1, newOrders: 1, confirmedOrders: 0, pendingPayments: 1, pendingDeliveries: 1 },
      recentOrders: [sampleOrder],
      recentCustomers: [],
      products: [],
      salesSummary: {
        timeZone: "Africa/Nairobi",
        periodStarts: { today: "2026-09-12T21:00:00.000Z", week: "2026-09-06T21:00:00.000Z", month: "2026-08-31T21:00:00.000Z" },
        periods: { today: { productSalesMinor: 60000, paidRevenueMinor: 0, awaitingPaymentMinor: 60000, unitsOrdered: 1 }, week: { productSalesMinor: 60000, paidRevenueMinor: 0, awaitingPaymentMinor: 60000, unitsOrdered: 1 }, month: { productSalesMinor: 60000, paidRevenueMinor: 0, awaitingPaymentMinor: 60000, unitsOrdered: 1 } },
        unitsByVariant: [],
        revenueBySource: [],
      },
    }),
    listOrders: vi.fn().mockResolvedValue({ orders: [sampleOrder] }),
    getOrder: vi.fn().mockResolvedValue(sampleOrder),
    updateOrderStatuses: vi.fn().mockImplementation(async (_reference, update) => ({ order: { ...sampleOrder, ...{
      orderStatus: update.orderStatus?.toLowerCase() ?? sampleOrder.orderStatus,
      paymentStatus: update.paymentStatus?.toLowerCase() ?? sampleOrder.paymentStatus,
      deliveryStatus: update.deliveryStatus?.toLowerCase() ?? sampleOrder.deliveryStatus,
    } }, changed: update })),
    recordPayment: vi.fn().mockResolvedValue({ ...sampleOrder, paymentStatus: "partially_paid" }),
    listInventory: vi.fn().mockResolvedValue({ products: [] }),
    adjustInventory: vi.fn().mockResolvedValue({ variantId: "variant-test", stockQuantity: 10 }),
    recordManualSale: vi.fn().mockResolvedValue({ ...sampleOrder, source: "walk_in" }),
    listCustomers: vi.fn().mockResolvedValue({ customers: [] }),
  } satisfies AdminService;
}

async function createTestApp(options: { loginLimit?: number; orderNotifier?: OwnerOrderNotifier } = {}) {
  const service = createMockService();
  const app = await createApp({
    serveFrontend: false,
    resendApiKey: "",
    adminAuth: createAdminAuth({ email: ADMIN_EMAIL, passwordHash, sessionSecret: SESSION_SECRET, secureCookies: false }),
    adminService: service,
    adminLoginRateLimiter: createAdminLoginRateLimiter({ windowMs: 60_000, limit: options.loginLimit ?? 20 }),
    orderNotifier: options.orderNotifier,
  });
  return { app, service };
}

async function login(agent: ReturnType<typeof request.agent>) {
  const response = await agent.post("/api/admin/auth/login").send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  expect(response.status).toBe(200);
  return response.body as { csrfToken: string };
}

describe("admin authentication and APIs", () => {
  it("logs in successfully and issues an HTTP-only same-site session cookie", async () => {
    const { app } = await createTestApp();
    const response = await request(app).post("/api/admin/auth/login").send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ email: ADMIN_EMAIL, role: "owner" });
    expect(response.body.csrfToken).toMatch(/^[A-Za-z0-9_-]{32,}$/);
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(response.headers["set-cookie"][0]).toContain("SameSite=Strict");
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  it("uses a secure host-only cookie in production mode", async () => {
    const app = await createApp({
      serveFrontend: false,
      resendApiKey: "",
      adminAuth: createAdminAuth({ email: ADMIN_EMAIL, passwordHash, sessionSecret: SESSION_SECRET, secureCookies: true }),
      adminService: createMockService(),
      adminLoginRateLimiter: (_request, _response, next) => next(),
    });
    const response = await request(app).post("/api/admin/auth/login").send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const cookie = response.headers["set-cookie"][0];
    expect(cookie).toContain("__Host-asili_admin_session=");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toContain("Domain=");
  });

  it("returns the same safe response for failed credentials", async () => {
    const { app } = await createTestApp();
    const response = await request(app).post("/api/admin/auth/login").send({ email: ADMIN_EMAIL, password: "wrong" });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid email or password.", code: "INVALID_CREDENTIALS" });
  });

  it("rate limits repeated failed logins", async () => {
    const { app } = await createTestApp({ loginLimit: 2 });
    const agent = request.agent(app);
    await agent.post("/api/admin/auth/login").send({ email: ADMIN_EMAIL, password: "wrong-one" });
    await agent.post("/api/admin/auth/login").send({ email: ADMIN_EMAIL, password: "wrong-two" });
    const response = await agent.post("/api/admin/auth/login").send({ email: ADMIN_EMAIL, password: "wrong-three" });
    expect(response.status).toBe(429);
    expect(response.body.code).toBe("LOGIN_RATE_LIMITED");
  });

  it("rejects a protected route when unauthenticated", async () => {
    const { app } = await createTestApp();
    const response = await request(app).get("/api/admin/dashboard");
    expect(response.status).toBe(401);
    expect(response.body.code).toBe("UNAUTHENTICATED");
  });

  it("allows authenticated dashboard access", async () => {
    const { app, service } = await createTestApp();
    const agent = request.agent(app);
    await login(agent);
    const response = await agent.get("/api/admin/dashboard");
    expect(response.status).toBe(200);
    expect(response.body.metrics.totalOrders).toBe(1);
    expect(response.body.salesSummary.timeZone).toBe("Africa/Nairobi");
    expect(service.getDashboard).toHaveBeenCalledOnce();
  });

  it("lists orders and returns order detail", async () => {
    const { app, service } = await createTestApp();
    const agent = request.agent(app);
    await login(agent);
    const list = await agent.get("/api/admin/orders");
    const detail = await agent.get(`/api/admin/orders/${sampleOrder.orderReference}`);
    expect(list.status).toBe(200);
    expect(list.body.orders[0].orderReference).toBe(sampleOrder.orderReference);
    expect(detail.status).toBe(200);
    expect(detail.body.order.customer.normalizedPhone).toBe("+254712345678");
    expect(service.listOrders).toHaveBeenCalledOnce();
    expect(service.getOrder).toHaveBeenCalledWith(sampleOrder.orderReference);
  });

  it("passes order search and status filters to the service", async () => {
    const { app, service } = await createTestApp();
    const agent = request.agent(app);
    await login(agent);
    const response = await agent.get("/api/admin/orders?search=0712&orderStatus=new&paymentStatus=pending&deliveryStatus=pending&source=website");
    expect(response.status).toBe(200);
    expect(service.listOrders).toHaveBeenCalledWith(expect.objectContaining({ search: "0712", orderStatus: "NEW", paymentStatus: "PENDING", deliveryStatus: "PENDING", source: "WEBSITE" }));
  });

  it.each([
    ["orderStatus", "confirmed", OrderStatus.CONFIRMED],
    ["paymentStatus", "paid", PaymentStatus.PAID],
    ["deliveryStatus", "scheduled", DeliveryStatus.SCHEDULED],
  ] as const)("accepts a valid %s update", async (field, value, expected) => {
    const { app, service } = await createTestApp();
    const agent = request.agent(app);
    const session = await login(agent);
    const response = await agent.patch(`/api/admin/orders/${sampleOrder.orderReference}/statuses`)
      .set("X-CSRF-Token", session.csrfToken)
      .send({ [field]: value });
    expect(response.status).toBe(200);
    expect(service.updateOrderStatuses).toHaveBeenCalledWith(sampleOrder.orderReference, expect.objectContaining({ [field]: expected }));
  });

  it("rejects invalid status values and missing CSRF tokens", async () => {
    const { app, service } = await createTestApp();
    const agent = request.agent(app);
    const session = await login(agent);
    const invalid = await agent.patch(`/api/admin/orders/${sampleOrder.orderReference}/statuses`)
      .set("X-CSRF-Token", session.csrfToken)
      .send({ orderStatus: "invented" });
    const noCsrf = await agent.patch(`/api/admin/orders/${sampleOrder.orderReference}/statuses`)
      .send({ orderStatus: "confirmed" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe("INVALID_STATUS");
    expect(noCsrf.status).toBe(403);
    expect(service.updateOrderStatuses).not.toHaveBeenCalled();
  });

  it("records an audited partial payment through a protected endpoint", async () => {
    const { app, service } = await createTestApp();
    const agent = request.agent(app);
    const session = await login(agent);
    const response = await agent.post(`/api/admin/orders/${sampleOrder.orderReference}/payments`)
      .set("X-CSRF-Token", session.csrfToken)
      .send({ amountMinor: 20000, method: "M-Pesa", reference: "TEST-RECEIPT" });
    expect(response.status).toBe(201);
    expect(service.recordPayment).toHaveBeenCalledWith(sampleOrder.orderReference, expect.objectContaining({ amountMinor: 20000, method: "M-Pesa", reference: "TEST-RECEIPT" }));
  });

  it("sends one customer lifecycle notification only when a status actually changes", async () => {
    const notifier: OwnerOrderNotifier = { notifyWebsiteOrder: vi.fn(), notifyCustomerLifecycle: vi.fn().mockResolvedValue(undefined) };
    const { app } = await createTestApp({ orderNotifier: notifier });
    const agent = request.agent(app);
    const session = await login(agent);
    const response = await agent.patch(`/api/admin/orders/${sampleOrder.orderReference}/statuses`)
      .set("X-CSRF-Token", session.csrfToken)
      .send({ orderStatus: "new", paymentStatus: "pending", deliveryStatus: "dispatched" });
    expect(response.status).toBe(200);
    expect(notifier.notifyCustomerLifecycle).toHaveBeenCalledWith(expect.objectContaining({ orderReference: sampleOrder.orderReference }), "CUSTOMER_DISPATCHED");
  });

  it("does not resend a lifecycle notification for an unchanged status request", async () => {
    const notifier: OwnerOrderNotifier = { notifyWebsiteOrder: vi.fn(), notifyCustomerLifecycle: vi.fn().mockResolvedValue(undefined) };
    const { app, service } = await createTestApp({ orderNotifier: notifier });
    vi.mocked(service.updateOrderStatuses).mockResolvedValue({ order: sampleOrder, changed: {} });
    const agent = request.agent(app);
    const session = await login(agent);
    const response = await agent.patch(`/api/admin/orders/${sampleOrder.orderReference}/statuses`)
      .set("X-CSRF-Token", session.csrfToken)
      .send({ orderStatus: "new", paymentStatus: "pending", deliveryStatus: "pending" });
    expect(response.status).toBe(200);
    expect(notifier.notifyCustomerLifecycle).not.toHaveBeenCalled();
  });

  it("logs out and invalidates the browser cookie", async () => {
    const { app } = await createTestApp();
    const agent = request.agent(app);
    const session = await login(agent);
    const logout = await agent.post("/api/admin/auth/logout").set("X-CSRF-Token", session.csrfToken);
    const protectedResponse = await agent.get("/api/admin/dashboard");
    expect(logout.status).toBe(204);
    expect(logout.headers["set-cookie"][0]).toContain("Expires=Thu, 01 Jan 1970");
    expect(protectedResponse.status).toBe(401);
  });

  it("protects inventory reads and requires CSRF for inventory writes", async () => {
    const { app, service } = await createTestApp();
    const unauthenticated = await request(app).get("/api/admin/inventory");
    expect(unauthenticated.status).toBe(401);
    const agent = request.agent(app);
    const session = await login(agent);
    const inventory = await agent.get("/api/admin/inventory");
    const rejected = await agent.post("/api/admin/inventory/variant-test/movements").send({ action: "opening_stock", quantity: 10, reason: "Opening count" });
    const accepted = await agent.post("/api/admin/inventory/variant-test/movements").set("X-CSRF-Token", session.csrfToken).send({ action: "opening_stock", quantity: 10, reason: "Opening count" });
    expect(inventory.status).toBe(200);
    expect(rejected.status).toBe(403);
    expect(accepted.status).toBe(201);
    expect(service.adjustInventory).toHaveBeenCalledWith("variant-test", expect.objectContaining({ action: "opening_stock", quantity: 10 }));
  });

  it("records a validated manual sale through the protected API", async () => {
    const { app, service } = await createTestApp();
    const agent = request.agent(app);
    const session = await login(agent);
    const response = await agent.post("/api/admin/sales").set("X-CSRF-Token", session.csrfToken).send({ source: "walk_in", customerName: "Walk-in test", customerPhone: "0712345678", variantId: "variant-test", quantity: 1, unitPriceMinor: 60000, paymentStatus: "paid", paymentMethod: "Cash" });
    expect(response.status).toBe(201);
    expect(service.recordManualSale).toHaveBeenCalledWith(expect.objectContaining({ source: "WALK_IN", customerPhone: "+254712345678", paymentStatus: "PAID" }));
  });
});
