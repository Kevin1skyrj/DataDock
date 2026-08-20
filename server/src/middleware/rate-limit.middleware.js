import { rateLimit } from "express-rate-limit";

function createRateLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({
        success: false,
        error: {
          code: "too-many-requests",
          message,
        },
      });
    },
  });
}

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: "Too many requests. Please try again shortly.",
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Too many accounts were created from this connection. Please try again later.",
});

export const otpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many verification attempts. Please try again in 15 minutes.",
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many password reset attempts. Please try again in 15 minutes.",
});

export const billingRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Too many billing requests. Please try again later.",
});
