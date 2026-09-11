import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  asiliPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.asiliPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.asiliPrisma = prisma;
}
