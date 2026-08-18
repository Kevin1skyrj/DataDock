import { Router } from "express";
import {
  downloadShare,
  downloadSharedChild,
  listSharedFolder,
  openShare,
  previewSharedChild,
  previewShare,
} from "../controllers/share.controller.js";

const shareRouter = Router();
shareRouter.get("/:token/items", listSharedFolder);
shareRouter.get("/:token/items/:itemId/preview", previewSharedChild);
shareRouter.get("/:token/items/:itemId/download", downloadSharedChild);
shareRouter.get("/:token/preview", previewShare);
shareRouter.get("/:token/download", downloadShare);
shareRouter.get("/:token", openShare);
export default shareRouter;
