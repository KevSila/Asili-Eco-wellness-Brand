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

  it("reports database readiness when the query succeeds", async () => {
    const databaseReadinessCheck = vi.fn().mockResolvedValue(undefined);
    const app = await createApp({
      serveFrontend: false,
      resendApiKey: "",
      databaseReadinessCheck,
    });
    const response = await request(app).get("/api/health/db");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "silatech-business-helper-api",
      database: "ready",
    });
    expect(databaseReadinessCheck).toHaveBeenCalledOnce();
  });

  it("returns a safe unavailable response when the database query fails", async () => {
    const databaseReadinessCheck = vi.fn().mockRejectedValue(new Error("private database error"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = await createApp({
      serveFrontend: false,
      resendApiKey: "",
      databaseReadinessCheck,
    });
    const response = await request(app).get("/api/health/db");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: "unavailable",
      service: "silatech-business-helper-api",
      database: "unavailable",
    });
    expect(JSON.stringify(response.body)).not.toContain("private database error");
    expect(errorLog).toHaveBeenCalledOnce();
    errorLog.mockRestore();
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
