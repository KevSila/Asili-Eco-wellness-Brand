import { Router } from "express";
import { z } from "zod";
import { normalizeKenyanPhoneNumber } from "../lib/kenyan-phone";
import {
  businessService,
  IdempotencyConflictError,
  InsufficientStockError,
  InvalidOrderTotalError,
  MixedCurrencyError,
  ProductUnavailableError,
  type BusinessService,
  type CreateOrderInput,
} from "../services/business";
import type { OwnerOrderNotifier } from "../services/order-notification";
import { NotificationType } from "@prisma/client";

const optionalEmail = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().email().max(254).optional(),
);

const optionalText = (maxLength: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(maxLength).optional(),
);

const orderRequestSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(1).max(40)
      .refine((value) => normalizeKenyanPhoneNumber(value) !== null, {
        message: "Enter a valid Kenyan mobile number.",
      })
      .transform((value) => normalizeKenyanPhoneNumber(value) as string),
    email: optionalEmail,
  }).strict(),
  deliveryLocation: z.string().trim().min(2).max(240),
  customerNote: optionalText(1000),
  items: z.array(z.object({
    variantId: z.string().trim().min(1).max(64),
    quantity: z.number().int().positive().max(1000),
  }).strict()).min(1).max(20),
}).strict().superRefine((input, context) => {
  const variantIds = input.items.map((item) => item.variantId);
  if (new Set(variantIds).size !== variantIds.length) {
    context.addIssue({
      code: "custom",
      path: ["items"],
      message: "Each variant may appear only once.",
    });
  }
});

const idempotencyKeySchema = z.uuid();

export function createOrdersRouter(service: BusinessService = businessService, notifier?: OwnerOrderNotifier) {
  const router = Router();

  router.post("/", async (req, res) => {
    const idempotencyKey = idempotencyKeySchema.safeParse(req.get("Idempotency-Key"));
    if (!idempotencyKey.success) {
      return res.status(400).json({
        error: "A valid idempotency key is required.",
        code: "INVALID_IDEMPOTENCY_KEY",
      });
    }

    const parsed = orderRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Please check the order details.",
        code: "INVALID_ORDER",
      });
    }

    try {
      const orderInput: CreateOrderInput = {
        ...parsed.data,
        customer: {
          ...parsed.data.customer,
          phone: parsed.data.customer.phone as string,
        },
      };
      const result = await service.createOrder(orderInput, { idempotencyKey: idempotencyKey.data });
      if (!result.replayed && notifier) {
        try {
          await notifier.notifyWebsiteOrder(result.order);
        } catch {
          console.error("Owner order notification failed.");
        }
        try {
          await notifier.notifyCustomerLifecycle?.(result.order, NotificationType.CUSTOMER_ORDER_RECEIVED);
        } catch {
          console.error("Customer order receipt notification failed.");
        }
      }
      return res.status(result.replayed ? 200 : 201).json(result);
    } catch (error) {
      if (error instanceof ProductUnavailableError) {
        return res.status(400).json({ error: error.message, code: "PRODUCT_UNAVAILABLE" });
      }
      if (error instanceof InsufficientStockError) {
        return res.status(409).json({ error: error.message, code: "INSUFFICIENT_STOCK" });
      }
      if (error instanceof IdempotencyConflictError) {
        return res.status(409).json({ error: error.message, code: "IDEMPOTENCY_CONFLICT" });
      }
      if (error instanceof MixedCurrencyError || error instanceof InvalidOrderTotalError) {
        return res.status(400).json({ error: error.message, code: "INVALID_ORDER" });
      }

      console.error("Order creation failed.", error);
      return res.status(500).json({ error: "Unable to create the order.", code: "ORDER_FAILED" });
    }
  });

  return router;
}
