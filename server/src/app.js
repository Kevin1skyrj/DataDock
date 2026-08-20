import express from "express";
import cors from "cors";
import helmet from "helmet";
import apiRouter from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import billingWebhookRouter from "./routes/billing-webhook.routes.js";
import { apiRateLimiter } from "./middleware/rate-limit.middleware.js";
import { protectFromCsrf } from "./middleware/csrf.middleware.js";
const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN;
const cookieSecret = process.env.COOKIE_SECRET;
const otpSecret = process.env.OTP_SECRET;
const production = process.env.NODE_ENV === "production";
if (!cookieSecret) {
  throw new Error("COOKIE_SECRET is missing from environment variables");
}

if (!otpSecret) {
  throw new Error("OTP_SECRET is missing from environment variables");
}

if (!clientOrigin) {
  throw new Error("CLIENT_ORIGIN is missing from environment variables");
}

let parsedClientOrigin;
try {
  parsedClientOrigin = new URL(clientOrigin);
} catch {
  throw new Error("CLIENT_ORIGIN must be a valid URL");
}

if (
  !["http:", "https:"].includes(parsedClientOrigin.protocol) ||
  parsedClientOrigin.origin !== clientOrigin
) {
  throw new Error("CLIENT_ORIGIN must contain only an HTTP(S) origin");
}

if (production && parsedClientOrigin.protocol !== "https:") {
  throw new Error("CLIENT_ORIGIN must use HTTPS in production");
}

if (production && (cookieSecret.length < 32 || otpSecret.length < 32)) {
  throw new Error("COOKIE_SECRET and OTP_SECRET must each contain at least 32 characters in production");
}

if (production) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);

app.use("/api/v1/billing/webhook", billingWebhookRouter);
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" } });
});
app.use("/api/v1", apiRateLimiter);
app.use("/api/v1", protectFromCsrf);
app.use("/api/v1", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser(cookieSecret));
app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);
export default app;
