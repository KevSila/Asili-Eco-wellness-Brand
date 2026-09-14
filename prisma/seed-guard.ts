const PRODUCTION_OVERRIDE_VARIABLE = "ALLOW_PRODUCTION_DATABASE_SEED";

interface SeedEnvironment {
  RAILWAY_ENVIRONMENT_NAME?: string;
  NODE_ENV?: string;
  ALLOW_PRODUCTION_DATABASE_SEED?: string;
}

export interface SeedTarget {
  environmentName: string;
  isProduction: boolean;
}

export class DatabaseSeedBlockedError extends Error {}

function safeEnvironmentName(value: string | undefined) {
  const name = value?.trim();
  return name && /^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,63}$/.test(name)
    ? name
    : undefined;
}

export function identifySeedTarget(environment: SeedEnvironment): SeedTarget {
  const railwayEnvironmentName = safeEnvironmentName(environment.RAILWAY_ENVIRONMENT_NAME);
  const nodeEnvironmentName = safeEnvironmentName(environment.NODE_ENV);
  const environmentName = railwayEnvironmentName ?? nodeEnvironmentName ?? "local";
  const normalizedName = environmentName.toLowerCase();
  const isProduction = railwayEnvironmentName
    ? normalizedName === "production" || normalizedName === "prod"
    : normalizedName === "production";

  return { environmentName, isProduction };
}

export function assertDatabaseSeedAllowed(environment: SeedEnvironment): SeedTarget {
  const target = identifySeedTarget(environment);

  if (
    target.isProduction
    && environment.ALLOW_PRODUCTION_DATABASE_SEED !== "true"
  ) {
    throw new DatabaseSeedBlockedError(
      `Database seed refused for environment: ${target.environmentName}. `
      + `Set ${PRODUCTION_OVERRIDE_VARIABLE}=true only for a deliberate, reviewed production seed.`,
    );
  }

  return target;
}
