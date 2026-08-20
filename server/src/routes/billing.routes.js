import { Router } from "express";

import {
  cancelSubscription,
  createSubscription,
  getCurrentBilling,
  getPlans,
  verifySubscription,
} from "../controllers/billing.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const billingRouter = Router();

billingRouter.get("/plans", getPlans);
billingRouter.get("/current", authenticate, getCurrentBilling);
billingRouter.post(
  "/subscriptions",
  authenticate,
  createSubscription,
);
billingRouter.post(
  "/subscriptions/verify",
  authenticate,
  verifySubscription,
);
billingRouter.post(
  "/subscriptions/cancel",
  authenticate,
  cancelSubscription,
);

export default billingRouter;
