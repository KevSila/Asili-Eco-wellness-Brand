import express from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { createContactRouter } from "./routes/contact";
import { healthRouter } from "./routes/health";

interface CreateAppOptions {
  serveFrontend?: boolean;
  resendApiKey?: string;
  contactFromEmail?: string;
  contactToEmail?: string;
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const serveFrontend = options.serveFrontend ?? true;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "20kb" }));
  app.use("/api/health", healthRouter);
  app.use(
    "/api/contact",
    createContactRouter({
      resendApiKey: options.resendApiKey ?? process.env.RESEND_API_KEY,
      fromEmail: options.contactFromEmail ?? process.env.CONTACT_FROM_EMAIL,
      toEmail: options.contactToEmail ?? process.env.CONTACT_TO_EMAIL,
    }),
  );

  if (!serveFrontend) {
    return app;
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const page = req.path === "/honey" || req.path.startsWith("/honey/")
        ? path.join(distPath, "honey", "index.html")
        : path.join(distPath, "index.html");
      res.sendFile(page);
    });
  }

  return app;
}
