import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/server/app";
import { createOrderRateLimiter } from "../src/server/middleware/order-rate-limit";
import type { BusinessService } from "../src/server/services/business";

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
});
