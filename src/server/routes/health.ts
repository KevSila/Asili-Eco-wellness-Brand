import { Router } from "express";
import {
  checkDatabaseReadiness,
  type DatabaseReadinessCheck,
} from "../services/database-readiness";

interface HealthRouterOptions {
  databaseReadinessCheck?: DatabaseReadinessCheck;
}

export function createHealthRouter(options: HealthRouterOptions = {}) {
  const router = Router();
  const databaseCheck = options.databaseReadinessCheck ?? checkDatabaseReadiness;

  router.get("/", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "silatech-business-helper-api",
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
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Database readiness check failed.", error);
      return res.status(503).json({
        status: "unavailable",
        service: "silatech-business-helper-api",
        database: "unavailable",
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
