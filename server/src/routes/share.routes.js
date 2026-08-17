import { Router } from "express";
import { openShare } from "../controllers/share.controller.js";

const shareRouter = Router();
shareRouter.get("/:token", openShare);
export default shareRouter;
