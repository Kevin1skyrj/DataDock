import { Router } from "express";
import {
  downloadShare,
  openShare,
  previewShare,
} from "../controllers/share.controller.js";

const shareRouter = Router();
shareRouter.get("/:token/preview", previewShare);
shareRouter.get("/:token/download", downloadShare);
shareRouter.get("/:token", openShare);
export default shareRouter;
