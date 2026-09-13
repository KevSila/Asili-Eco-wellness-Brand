import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/server/app";
import { createOrderRateLimiter } from "../src/server/middleware/order-rate-limit";
import type { BusinessService } from "../src/server/services/business";
import type { OwnerOrderNotifier } from "../src/server/services/order-notification";

function stubService(): BusinessService {
  return {
    listProducts: vi.fn().mockResolvedValue([]),
    getProductBySlug: vi.fn().mockResolvedValue(null),
    createOrder: vi.fn().mockRejectedValue(new Error("private database detail")),
  };
}

describe("public order hardening", () => {
  it("requires a UUID idempotency key before processing an order", async () => {
    const service = stubService();
    const app = await createApp({
      serveFrontend: false,
      resendApiKey: "",
      businessService: service,
      orderRateLimiter: (_request, _response, next) => next(),
    });
    const response = await request(app).post("/api/orders").send({});

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_IDEMPOTENCY_KEY");
    expect(service.createOrder).not.toHaveBeenCalled();
  });

  it("rate limits repeated public order attempts with a safe response", async () => {
    const app = await createApp({
      serveFrontend: false,
      resendApiKey: "",
      businessService: stubService(),
      orderRateLimiter: createOrderRateLimiter({ windowMs: 60_000, limit: 1 }),
    });
    const first = await request(app).post("/api/orders")
      .set("Idempotency-Key", randomUUID()).send({});
    const limited = await request(app).post("/api/orders")
      .set("Idempotency-Key", randomUUID()).send({});

    expect(first.status).toBe(400);
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      error: "Too many order attempts. Please wait and try again.",
      code: "RATE_LIMITED",
    });
  });

  it("does not expose internal errors", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = await createApp({
      serveFrontend: false,
      resendApiKey: "",
      businessService: stubService(),
      orderRateLimiter: (_request, _response, next) => next(),
    });
    const response = await request(app).post("/api/orders")
      .set("Idempotency-Key", randomUUID())
      .send({
        customer: { name: "Test User", phone: "0712345678", email: "" },
        deliveryLocation: "Nairobi",
        customerNote: "",
        items: [{ variantId: "variant-test", quantity: 1 }],
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Unable to create the order.", code: "ORDER_FAILED" });
    expect(JSON.stringify(response.body)).not.toContain("private database detail");
    errorLog.mockRestore();
  });

  it("triggers an owner notification after a new website order", async () => {
    const order = {
      orderReference: "ASILI-260913-NOTIFY",
      createdAt: "2026-09-13T00:00:00.000Z",
      status: "new", paymentStatus: "pending", deliveryStatus: "pending", currency: "KES",
      subtotalMinor: 60000, deliveryFeeMinor: 0, totalAmountMinor: 60000,
      customer: { name: "Notify Test", phone: "+254712345678", email: null },
      deliveryLocation: "Nairobi", customerNote: null,
      items: [{ sku: "ASILI-HONEY-500G", productName: "Asili Raw Makueni Honey", variantName: "500g", quantity: 1, unitPriceMinor: 60000, lineTotalMinor: 60000 }],
    };
    const service = stubService();
    vi.mocked(service.createOrder).mockResolvedValue({ order, replayed: false });
    const notifier: OwnerOrderNotifier = { notifyWebsiteOrder: vi.fn().mockResolvedValue(undefined) };
    const app = await createApp({ serveFrontend: false, resendApiKey: "", businessService: service, orderNotifier: notifier, orderRateLimiter: (_request, _response, next) => next() });
    const response = await request(app).post("/api/orders").set("Idempotency-Key", randomUUID()).send({ customer: { name: "Notify Test", phone: "0712345678" }, deliveryLocation: "Nairobi", items: [{ variantId: "variant-test", quantity: 1 }] });
    expect(response.status).toBe(201);
    expect(notifier.notifyWebsiteOrder).toHaveBeenCalledWith(order);
  });

  it("does not roll back or fail an order when notification fails", async () => {
    const service = stubService();
    const order = { orderReference: "ASILI-260913-NOTIFY", createdAt: "2026-09-13T00:00:00.000Z", status: "new", paymentStatus: "pending", deliveryStatus: "pending", currency: "KES", subtotalMinor: 60000, deliveryFeeMinor: 0, totalAmountMinor: 60000, customer: { name: "Notify Test", phone: "+254712345678", email: null }, deliveryLocation: "Nairobi", customerNote: null, items: [] };
    vi.mocked(service.createOrder).mockResolvedValue({ order, replayed: false });
    const notifier: OwnerOrderNotifier = { notifyWebsiteOrder: vi.fn().mockRejectedValue(new Error("private resend failure")) };
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = await createApp({ serveFrontend: false, resendApiKey: "", businessService: service, orderNotifier: notifier, orderRateLimiter: (_request, _response, next) => next() });
    const response = await request(app).post("/api/orders").set("Idempotency-Key", randomUUID()).send({ customer: { name: "Notify Test", phone: "0712345678" }, deliveryLocation: "Nairobi", items: [{ variantId: "variant-test", quantity: 1 }] });
    expect(response.status).toBe(201);
    expect(response.body.order.orderReference).toBe(order.orderReference);
    expect(errorLog).toHaveBeenCalledWith("Owner order notification failed.");
    errorLog.mockRestore();
  });
});
