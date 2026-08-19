import {
  createSubscription as createSubscriptionService,
  getCurrentBilling as getCurrentBillingService,
  listPlans as listPlansService,
  processWebhook as processWebhookService,
  verifySubscription as verifySubscriptionService,
} from "../services/billing.service.js";

export async function processWebhook(req, res, next) {
  try {
    const result = await processWebhookService({
      rawBody: req.body,
      signature: req.get("x-razorpay-signature"),
      eventId: req.get("x-razorpay-event-id"),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentBilling(req, res, next) {
  try {
    const billing = await getCurrentBillingService(req.user.id);

    res.status(200).json({
      success: true,
      data: billing,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPlans(req, res, next) {
  try {
    const plans = listPlansService();

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
}

export async function createSubscription(req, res, next) {
  try {
    const subscription = await createSubscriptionService({
      userId: req.user.id,
      planId: req.body?.planId,
    });

    res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifySubscription(req, res, next) {
  try {
    const result = await verifySubscriptionService({
      userId: req.user.id,
      paymentId: req.body?.paymentId,
      subscriptionId: req.body?.subscriptionId,
      signature: req.body?.signature,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
