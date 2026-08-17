import { Router } from "express";
import { authenticate } from "../middleware/authenticate.middleware.js";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  logout,
  getCurrentUser,
} from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.get("/me", authenticate, getCurrentUser);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resend-verification", resendVerification);
authRouter.post("/logout", authenticate, logout);
export default authRouter;
