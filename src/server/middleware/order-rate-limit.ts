import { rateLimit } from "express-rate-limit";

export function createOrderRateLimiter(options: { windowMs?: number; limit?: number } = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? 15 * 60 * 1000,
    limit: options.limit ?? 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_request, response) => response.status(429).json({
      error: "Too many order attempts. Please wait and try again.",
      code: "RATE_LIMITED",
    }),
  });
}
