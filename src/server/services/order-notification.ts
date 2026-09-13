import { Resend } from "resend";
import { NotificationStatus, NotificationType, Prisma } from "@prisma/client";
import { escapeHtml } from "../lib/text";
import { prisma } from "../db/client";
import type { PublicOrder } from "./business";

export interface OwnerOrderNotifier {
  notifyWebsiteOrder(order: PublicOrder): Promise<void>;
  notifyCustomerLifecycle?(order: CustomerNotificationOrder, type: NotificationType): Promise<void>;
}

export interface CustomerNotificationOrder {
  orderReference: string;
  customer: { name: string; email: string | null };
  currency: string;
  subtotalMinor: number;
  deliveryStatus: string;
  items: Array<{ productName: string; variantName: string; quantity: number }>;
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
    async notifyCustomerLifecycle(order, type) {
      if (!order.customer.email || !resend) return;
      const databaseOrder = await prisma.order.findUnique({ where: { orderNumber: order.orderReference }, select: { id: true } });
      if (!databaseOrder) return;

      try {
        await prisma.notificationLog.create({ data: { orderId: databaseOrder.id, type, recipient: order.customer.email } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
        throw error;
      }

      const copy: Record<NotificationType, { subject: string; heading: string; detail: string }> = {
        CUSTOMER_ORDER_RECEIVED: { subject: `We received Asili order ${order.orderReference}`, heading: "Your order is received", detail: "We will contact you to confirm delivery details and the location-based delivery fee." },
        CUSTOMER_DISPATCHED: { subject: `Asili order ${order.orderReference} is on its way`, heading: "Your order has been dispatched", detail: "Your Asili order has left for delivery." },
        CUSTOMER_DELIVERED: { subject: `Asili order ${order.orderReference} was delivered`, heading: "Your order was delivered", detail: "Thank you for choosing Asili." },
        CUSTOMER_CANCELLED: { subject: `Asili order ${order.orderReference} was cancelled`, heading: "Your order was cancelled", detail: "Please contact us if you have questions about this update." },
        CUSTOMER_REFUNDED: { subject: `Refund update for Asili order ${order.orderReference}`, heading: "Your payment was refunded", detail: "Please contact us if you need any help with this refund." },
      };
      const message = copy[type];
      const itemRows = order.items.map((item) => `<li>${escapeHtml(item.productName)} — ${escapeHtml(item.variantName)} × ${item.quantity}</li>`).join("");
      try {
        const { error } = await resend.emails.send({
          from: fromEmail,
          to: [order.customer.email],
          subject: message.subject,
          html: `<div style="font-family:sans-serif;max-width:640px;margin:0 auto"><h1>${escapeHtml(message.heading)}</h1><p>Hi ${escapeHtml(order.customer.name)},</p><p>${escapeHtml(message.detail)}</p><p><strong>Reference:</strong> ${escapeHtml(order.orderReference)}</p><ul>${itemRows}</ul><p><strong>Product subtotal:</strong> ${escapeHtml(money(order.subtotalMinor, order.currency))}</p></div>`,
        });
        if (error) throw new Error("Resend rejected the customer notification.");
        await prisma.notificationLog.update({ where: { orderId_type: { orderId: databaseOrder.id, type } }, data: { status: NotificationStatus.SENT, sentAt: new Date() } });
      } catch (error) {
        await prisma.notificationLog.update({ where: { orderId_type: { orderId: databaseOrder.id, type } }, data: { status: NotificationStatus.FAILED } }).catch(() => undefined);
        throw error;
      }
    },
  };
}
