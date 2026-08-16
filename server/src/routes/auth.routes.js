import { Router } from "express";

import { register } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", register);

export default authRouter;