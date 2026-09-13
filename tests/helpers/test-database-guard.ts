type DatabaseEnvironment = Record<string, string | undefined>;

function databaseIdentity(value: string, variableName: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL.`);
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error(`${variableName} must use the PostgreSQL protocol.`);
  }

  const port = url.port || "5432";
  return `${url.hostname.toLowerCase()}:${port}${url.pathname}`;
}

function isLocalHost(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname.toLowerCase());
}

export function resolveSafeTestDatabaseUrl(env: DatabaseEnvironment): string | null {
  if (env.RUN_DATABASE_TESTS !== "true") {
    return null;
  }

  const testUrl = env.TEST_DATABASE_URL?.trim();
  if (!testUrl) {
    throw new Error(
      "Database tests require TEST_DATABASE_URL. DATABASE_URL is never used as a fallback.",
    );
  }

  const testIdentity = databaseIdentity(testUrl, "TEST_DATABASE_URL");
  if (env.DATABASE_URL?.trim()) {
    const applicationIdentity = databaseIdentity(env.DATABASE_URL, "DATABASE_URL");
    if (testIdentity === applicationIdentity) {
      throw new Error("TEST_DATABASE_URL must not point to the same database as DATABASE_URL.");
    }
  }

  const parsed = new URL(testUrl);
  if (!isLocalHost(parsed.hostname) && env.ALLOW_REMOTE_TEST_DATABASE !== "true") {
    throw new Error(
      "Remote database tests are disabled. Set ALLOW_REMOTE_TEST_DATABASE=true only for a dedicated test database.",
    );
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!databaseName.toLowerCase().includes("test") && env.ALLOW_UNMARKED_TEST_DATABASE !== "true") {
    throw new Error(
      "TEST_DATABASE_URL database name must contain 'test'. Set ALLOW_UNMARKED_TEST_DATABASE=true only for a verified disposable database.",
    );
  }

  return testUrl;
}

export function configureTestDatabaseEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const testUrl = resolveSafeTestDatabaseUrl(env);
  if (testUrl) {
    env.DATABASE_URL = testUrl;
  }
}
