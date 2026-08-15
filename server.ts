import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cleanText = (value: unknown, maxLength = 1000) =>
  String(value ?? "").trim().slice(0, maxLength);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20kb" }));

  // Resend initialization
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // API Routes
  app.post("/api/contact", async (req, res) => {
    const name = cleanText(req.body?.name, 120);
    const email = cleanText(req.body?.email, 254);
    const company = cleanText(req.body?.company, 160);
    const interest = cleanText(req.body?.interest, 160);
    const requirements = cleanText(req.body?.requirements, 3000);
    const message = cleanText(req.body?.message, 3000);
    const phone = cleanText(req.body?.phone, 40);
    const type = cleanText(req.body?.type, 80) || "Website";

    if (!name || !email || !/^\S+@\S+\.\S+$/.test(email) || (!message && !requirements)) {
      return res.status(400).json({ error: "Please provide a valid name, email and message." });
    }

    const safe = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      company: escapeHtml(company),
      interest: escapeHtml(interest),
      requirements: escapeHtml(requirements),
      message: escapeHtml(message),
      phone: escapeHtml(phone),
      type: escapeHtml(type.replace(/[\r\n]+/g, " ")),
    };

    if (!resend) {
      console.warn("RESEND_API_KEY is not configured. Email not sent.");
      return res.status(200).json({ success: true, message: "Server received message (Email not sent - no API key)" });
    }

    try {
      console.log(`Attempting to send email for ${safe.type} from ${safe.name}...`);
      const { data, error } = await resend.emails.send({
        from: "Asili Web <onboarding@resend.dev>",
        to: ["kevinsila100@gmail.com"],
        subject: `Asili Inquiry: ${safe.type} from ${safe.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #2D4F1E; margin-bottom: 20px;">New ${safe.type} Inquiry</h1>
            <p><strong>Name:</strong> ${safe.name}</p>
            <p><strong>Email:</strong> ${safe.email}</p>
            <p><strong>Phone:</strong> ${safe.phone || "Not provided"}</p>
            <p><strong>Organization:</strong> ${safe.company || "N/A"}</p>
            <p><strong>Interest/Service:</strong> ${safe.interest || "N/A"}</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p><strong>Message / Requirements:</strong></p>
              <p style="white-space: pre-wrap; color: #555;">${safe.message || safe.requirements}</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Resend API error:", error);
        return res.status(error.statusCode || 500).json({ 
          error: "Resend API error", 
          details: error.message 
        });
      }

      console.log("Email sent successfully:", data?.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Server catch error:", err);
      res.status(500).json({ error: "Internal server error", details: err instanceof Error ? err.message : String(err) });
    }
  });

  // Vite middleware for development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
