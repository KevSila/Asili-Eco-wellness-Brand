import { Resend } from "resend";
import { escapeHtml } from "../lib/text";
import type { PublicOrder } from "./business";

export interface OwnerOrderNotifier {
  notifyWebsiteOrder(order: PublicOrder): Promise<void>;
}

interface OrderNotifierOptions {
  resendApiKey?: string;
  fromEmail?: string;
  toEmail?: string;
  adminUrl?: string;
}

const money = (minor: number, currency: string) => new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency,
}).format(minor / 100);

export function createOwnerOrderNotifier(options: OrderNotifierOptions = {}): OwnerOrderNotifier {
  const resend = options.resendApiKey ? new Resend(options.resendApiKey) : null;
  const fromEmail = options.fromEmail || "Asili Orders <onboarding@resend.dev>";
  const toEmail = options.toEmail;
  const adminUrl = options.adminUrl?.replace(/\/$/, "");

  return {
    async notifyWebsiteOrder(order) {
      if (!resend || !toEmail) {
        console.warn("Owner order notification is not configured.");
        return;
      }

      const reference = escapeHtml(order.orderReference);
      const itemRows = order.items.map((item) => `
        <li>${escapeHtml(item.productName)} — ${escapeHtml(item.variantName)} × ${item.quantity}</li>
      `).join("");
      const orderLink = adminUrl
        ? `<p><a href="${escapeHtml(`${adminUrl}?order=${encodeURIComponent(order.orderReference)}`)}">Open this order in Asili Business Helper</a></p>`
        : "";
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: `New Asili website order ${reference}`,
        html: `
          <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
            <h1>New website order</h1>
            <p><strong>Reference:</strong> ${reference}</p>
            <p><strong>Customer:</strong> ${escapeHtml(order.customer.name)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(order.customer.phone)}</p>
            <p><strong>Delivery:</strong> ${escapeHtml(order.deliveryLocation)}</p>
            <ul>${itemRows}</ul>
            <p><strong>Product subtotal:</strong> ${escapeHtml(money(order.subtotalMinor, order.currency))}</p>
            <p><strong>Payment:</strong> ${escapeHtml(order.paymentStatus)}</p>
            <p><strong>Received:</strong> ${escapeHtml(order.createdAt)}</p>
            ${orderLink}
          </div>
        `,
      });
      if (error) throw new Error("Resend rejected the owner order notification.");
    },
  };
}
