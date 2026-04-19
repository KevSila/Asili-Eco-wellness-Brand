import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Resend initialization
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // API Routes
  app.post("/api/contact", async (req, res) => {
    const { name, email, company, interest, requirements, message, phone, type } = req.body;

    if (!resend) {
      console.warn("RESEND_API_KEY is not configured. Email not sent.");
      return res.status(200).json({ success: true, message: "Server received message (Email not sent - no API key)" });
    }

    try {
      console.log(`Attempting to send email for ${type} from ${name}...`);
      const { data, error } = await resend.emails.send({
        from: "Asili Web <onboarding@resend.dev>",
        to: ["kevinsila100@gmail.com"],
        subject: `Asili Inquiry: ${type} from ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #2D4F1E; margin-bottom: 20px;">New ${type} Inquiry</h1>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Organization:</strong> ${company || "N/A"}</p>
            <p><strong>Interest/Service:</strong> ${interest || "N/A"}</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p><strong>Message / Requirements:</strong></p>
              <p style="white-space: pre-wrap; color: #555;">${message || requirements || "No additional details provided."}</p>
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
      res.sendFile(path.join(distPath, "index.html"));
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
