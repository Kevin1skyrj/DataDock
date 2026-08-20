import { Router } from "express";
import {
  downloadShare,
  downloadSharedChild,
  listSharedFolder,
  openShare,
  previewSharedChild,
  previewShare,
} from "../controllers/share.controller.js";
import { validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  sharedChildParamsSchema,
  sharedFolderQuerySchema,
} from "../validators/share.validator.js";

const shareRouter = Router();
shareRouter.get(
  "/:token/items",
  validateQuery(sharedFolderQuerySchema),
  listSharedFolder,
);
shareRouter.get(
  "/:token/items/:itemId/preview",
  validateParams(sharedChildParamsSchema),
  previewSharedChild,
);
shareRouter.get(
  "/:token/items/:itemId/download",
  validateParams(sharedChildParamsSchema),
  downloadSharedChild,
);
shareRouter.get("/:token/preview", previewShare);
shareRouter.get("/:token/download", downloadShare);
shareRouter.get("/:token", openShare);
export default shareRouter;
