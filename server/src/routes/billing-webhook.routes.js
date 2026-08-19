import { Router, raw } from "express";

import { processWebhook } from "../controllers/billing.controller.js";

const billingWebhookRouter = Router();

billingWebhookRouter.post(
  "/",
  raw({ type: "application/json", limit: "1mb" }),
  processWebhook,
);

export default billingWebhookRouter;
