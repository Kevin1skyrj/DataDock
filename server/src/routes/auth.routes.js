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
const authRouter = Router();

authRouter.get("/me", authenticate, getCurrentUser);
authRouter.get("/google", startGoogleLogin);
authRouter.get("/google/callback", completeGoogleLogin);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resend-verification", resendVerification);
authRouter.post("/forgot-password", requestPasswordReset);
authRouter.post("/verify-reset-otp", verifyResetOtp);
authRouter.post("/reset-password", completePasswordReset);
authRouter.post("/change-password", authenticate, updatePassword);
authRouter.post("/logout", authenticate, logout);
authRouter.post("/logout-all", authenticate, logoutAll);
export default authRouter;
