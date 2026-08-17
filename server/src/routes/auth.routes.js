import { Router } from "express";

import {
  register,
  login,
  verifyEmail,
  resendVerification,
} from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resend-verification", resendVerification);
export default authRouter;
