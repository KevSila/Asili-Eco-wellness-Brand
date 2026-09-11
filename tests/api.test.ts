import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/server/app";

describe("API smoke tests", () => {
  it("reports a healthy API", async () => {
    const app = await createApp({ serveFrontend: false, resendApiKey: "" });
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "silatech-business-helper-api",
    });
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });

  it("rejects an invalid contact request", async () => {
    const app = await createApp({ serveFrontend: false, resendApiKey: "" });
    const response = await request(app)
      .post("/api/contact")
      .send({ name: "", email: "not-an-email", message: "" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Please provide a valid name, email and message.",
    });
  });

  it("preserves contact acceptance when email delivery is not configured", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const app = await createApp({ serveFrontend: false, resendApiKey: "" });
    const response = await request(app).post("/api/contact").send({
      name: "Local test",
      email: "test@example.com",
      message: "Smoke test",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    warning.mockRestore();
  });
});
