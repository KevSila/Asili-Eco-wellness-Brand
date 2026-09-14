import { describe, expect, it } from "vitest";
import {
  assertDatabaseSeedAllowed,
  identifySeedTarget,
} from "../prisma/seed-guard";

describe("database seed runtime guard", () => {
  it("permits convenient local development seeding", () => {
    expect(assertDatabaseSeedAllowed({ NODE_ENV: "development" })).toEqual({
      environmentName: "development",
      isProduction: false,
    });
  });

  it("permits Railway staging even though its Node runtime is production mode", () => {
    expect(assertDatabaseSeedAllowed({
      RAILWAY_ENVIRONMENT_NAME: "staging",
      NODE_ENV: "production",
    })).toEqual({
      environmentName: "staging",
      isProduction: false,
    });
  });

  it.each(["production", "Production", "prod"])(
    "refuses the Railway %s environment without the explicit override",
    (environmentName) => {
      expect(() => assertDatabaseSeedAllowed({
        RAILWAY_ENVIRONMENT_NAME: environmentName,
        NODE_ENV: "production",
      })).toThrow("Database seed refused");
    },
  );

  it("fails closed for a production Node runtime without a safe Railway environment name", () => {
    expect(() => assertDatabaseSeedAllowed({
      RAILWAY_ENVIRONMENT_NAME: "https://not-a-safe-environment-name.example",
      NODE_ENV: "production",
    })).toThrow("Database seed refused for environment: production");
  });

  it("requires the exact production override value", () => {
    expect(() => assertDatabaseSeedAllowed({
      RAILWAY_ENVIRONMENT_NAME: "production",
      ALLOW_PRODUCTION_DATABASE_SEED: "yes",
    })).toThrow("ALLOW_PRODUCTION_DATABASE_SEED=true");

    expect(assertDatabaseSeedAllowed({
      RAILWAY_ENVIRONMENT_NAME: "production",
      ALLOW_PRODUCTION_DATABASE_SEED: "true",
    })).toEqual({
      environmentName: "production",
      isProduction: true,
    });
  });

  it("uses only a validated environment name for display", () => {
    expect(identifySeedTarget({
      RAILWAY_ENVIRONMENT_NAME: "postgresql://user:password@example.test/database",
    })).toEqual({
      environmentName: "local",
      isProduction: false,
    });
  });
});
