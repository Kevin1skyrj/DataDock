import { Router } from "express";

import {
  cancelSubscription,
  createSubscription,
  getCurrentBilling,
  getPlans,
  verifySubscription,
} from "../controllers/billing.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { billingRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  createSubscriptionSchema,
  verifySubscriptionSchema,
} from "../validators/billing.validator.js";

const billingRouter = Router();

billingRouter.get("/plans", getPlans);
billingRouter.get("/current", authenticate, getCurrentBilling);
billingRouter.post(
  "/subscriptions",
  authenticate,
  billingRateLimiter,
  validateBody(createSubscriptionSchema),
  createSubscription,
);
billingRouter.post(
  "/subscriptions/verify",
  authenticate,
  validateBody(verifySubscriptionSchema),
  verifySubscription,
);
billingRouter.post(
  "/subscriptions/cancel",
  authenticate,
  cancelSubscription,
);

export default billingRouter;
