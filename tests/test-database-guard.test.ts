import { describe, expect, it } from "vitest";
import { resolveSafeTestDatabaseUrl } from "./helpers/test-database-guard";

describe("database integration test guard", () => {
  it("does nothing when database tests are disabled", () => {
    expect(resolveSafeTestDatabaseUrl({ DATABASE_URL: "not-even-a-url" })).toBeNull();
  });

  it("requires an explicit test database URL", () => {
    expect(() => resolveSafeTestDatabaseUrl({ RUN_DATABASE_TESTS: "true" })).toThrow(
      /require TEST_DATABASE_URL/,
    );
  });

  it("rejects the application database even when credentials and query parameters differ", () => {
    expect(() =>
      resolveSafeTestDatabaseUrl({
        RUN_DATABASE_TESTS: "true",
        DATABASE_URL: "postgresql://app:one@localhost:5432/asili_test?schema=public",
        TEST_DATABASE_URL: "postgresql://test:two@localhost/asili_test?sslmode=require",
      }),
    ).toThrow(/must not point to the same database/);
  });

  it("rejects remote databases by default", () => {
    expect(() =>
      resolveSafeTestDatabaseUrl({
        RUN_DATABASE_TESTS: "true",
        TEST_DATABASE_URL: "postgresql://user:pass@railway.internal:5432/asili_test",
      }),
    ).toThrow(/Remote database tests are disabled/);
  });

  it("accepts a clearly named local test database", () => {
    const url = "postgresql://user:pass@localhost:5432/asili_test";
    expect(resolveSafeTestDatabaseUrl({ RUN_DATABASE_TESTS: "true", TEST_DATABASE_URL: url })).toBe(
      url,
    );
  });
});
