import { prisma } from "../db/client";

export type DatabaseReadinessCheck = () => Promise<void>;

export const checkDatabaseReadiness: DatabaseReadinessCheck = async () => {
  await prisma.$queryRaw`SELECT 1`;
};
