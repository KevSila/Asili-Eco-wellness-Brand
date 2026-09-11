import { createApp } from "./app";
import { prisma } from "./db/client";

const DEFAULT_PORT = 3000;

function resolvePort(value: string | undefined) {
  if (!value) return DEFAULT_PORT;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

export async function startServer() {
  const port = resolvePort(process.env.PORT);
  const app = await createApp();
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down.`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  return server;
}
