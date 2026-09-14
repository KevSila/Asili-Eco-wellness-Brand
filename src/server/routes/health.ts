import { Router } from "express";
import {
  checkDatabaseReadiness,
  type DatabaseReadinessCheck,
} from "../services/database-readiness";

interface HealthRouterOptions {
  databaseReadinessCheck?: DatabaseReadinessCheck;
  railwayEnvironmentName?: string;
}

function getSafeEnvironmentName(value: string | undefined) {
  const environmentName = value?.trim();
  return environmentName && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(environmentName)
    ? environmentName
    : "local";
}

export function createHealthRouter(options: HealthRouterOptions = {}) {
  const router = Router();
  const databaseCheck = options.databaseReadinessCheck ?? checkDatabaseReadiness;
  const environment = getSafeEnvironmentName(
    options.railwayEnvironmentName ?? process.env.RAILWAY_ENVIRONMENT_NAME,
  );

  router.get("/", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "silatech-business-helper-api",
      environment,
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/db", async (_req, res) => {
    try {
      await databaseCheck();
      return res.status(200).json({
        status: "ok",
        service: "silatech-business-helper-api",
        database: "ready",
        environment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Database readiness check failed.", error);
      return res.status(503).json({
        status: "unavailable",
        service: "silatech-business-helper-api",
        database: "unavailable",
        environment,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
