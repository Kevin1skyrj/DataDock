import { Router } from "express";
import { authenticate } from "../middleware/authenticate.middleware.js";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  logout,
  logoutAll,
  getCurrentUser,
} from "../controllers/auth.controller.js";
import {
  completeGoogleLogin,
  startGoogleLogin,
} from "../controllers/google-auth.controller.js";
import {
  completePasswordReset,
  requestPasswordReset,
  updatePassword,
  verifyResetOtp,
} from "../controllers/password.controller.js";
import {
  getPreferences,
  updatePreferences,
  updateProfile,
} from "../controllers/account.controller.js";
import {
  loginRateLimiter,
  otpRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
} from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  emailSchema,
  emailVerificationSchema,
  loginSchema,
  passwordChangeSchema,
  passwordResetSchema,
  registrationSchema,
} from "../validators/auth.validator.js";
const authRouter = Router();

authRouter.get("/me", authenticate, getCurrentUser);
authRouter.patch("/me", authenticate, updateProfile);
authRouter.get("/preferences", authenticate, getPreferences);
authRouter.patch("/preferences", authenticate, updatePreferences);
authRouter.get("/google", startGoogleLogin);
authRouter.get("/google/callback", completeGoogleLogin);
authRouter.post(
  "/register",
  registrationRateLimiter,
  validateBody(registrationSchema),
  register,
);
authRouter.post("/login", loginRateLimiter, validateBody(loginSchema), login);
authRouter.post(
  "/verify-email",
  otpRateLimiter,
  validateBody(emailVerificationSchema),
  verifyEmail,
);
authRouter.post(
  "/resend-verification",
  otpRateLimiter,
  validateBody(emailSchema),
  resendVerification,
);
authRouter.post(
  "/forgot-password",
  passwordResetRateLimiter,
  validateBody(emailSchema),
  requestPasswordReset,
);
authRouter.post(
  "/verify-reset-otp",
  passwordResetRateLimiter,
  validateBody(emailVerificationSchema),
  verifyResetOtp,
);
authRouter.post(
  "/reset-password",
  passwordResetRateLimiter,
  validateBody(passwordResetSchema),
  completePasswordReset,
);
authRouter.post(
  "/change-password",
  authenticate,
  validateBody(passwordChangeSchema),
  updatePassword,
);
authRouter.post("/logout", authenticate, logout);
authRouter.post("/logout-all", authenticate, logoutAll);
export default authRouter;
