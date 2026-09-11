import { Router } from "express";
import { Resend } from "resend";
import { z } from "zod";
import { cleanText, escapeHtml } from "../lib/text";

const textField = (maxLength: number) =>
  z.preprocess((value) => cleanText(value, maxLength), z.string().max(maxLength));

const contactSchema = z
  .object({
    name: textField(120).pipe(z.string().min(1)),
    email: textField(254).pipe(z.string().email()),
    company: textField(160).optional().default(""),
    interest: textField(160).optional().default(""),
    requirements: textField(3000).optional().default(""),
    message: textField(3000).optional().default(""),
    phone: textField(40).optional().default(""),
    type: textField(80).optional().default("Website"),
  })
  .refine((input) => Boolean(input.message || input.requirements));

interface ContactRouterOptions {
  resendApiKey?: string;
  fromEmail?: string;
  toEmail?: string;
}

export function createContactRouter(options: ContactRouterOptions = {}) {
  const router = Router();
  const resend = options.resendApiKey ? new Resend(options.resendApiKey) : null;
  const fromEmail = options.fromEmail || "Asili Web <onboarding@resend.dev>";
  const toEmail = options.toEmail || "kevinsila100@gmail.com";

  router.post("/", async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Please provide a valid name, email and message." });
    }

    const safe = Object.fromEntries(
      Object.entries(parsed.data).map(([key, value]) => [key, escapeHtml(value)]),
    ) as typeof parsed.data;
    safe.type = escapeHtml(parsed.data.type.replace(/[\r\n]+/g, " "));

    if (!resend) {
      console.warn("RESEND_API_KEY is not configured. Email not sent.");
      return res.status(200).json({
        success: true,
        message: "Server received message (Email not sent - no API key)",
      });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
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
        return res.status(error.statusCode || 500).json({ error: "Unable to send inquiry email." });
      }

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Contact email error:", error);
      return res.status(500).json({ error: "Unable to send inquiry email." });
    }
  });

  return router;
}
