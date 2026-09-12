import { rateLimit } from "express-rate-limit";

interface AdminLoginRateLimitOptions {
  windowMs?: number;
  limit?: number;
}

export function createAdminLoginRateLimiter(options: AdminLoginRateLimitOptions = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? 15 * 60 * 1000,
    limit: options.limit ?? 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_request, response) => response.status(429).json({
      error: "Too many login attempts. Please wait and try again.",
      code: "LOGIN_RATE_LIMITED",
    }),
  });
}
