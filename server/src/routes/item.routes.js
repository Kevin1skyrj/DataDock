import { Router } from "express";
import {
  createFolder,
  getFolderPath,
  getItem,
  downloadItem,
  previewItem,
  getItems,
  renameItem,
  starItems,
  getStarredItems,
  moveItems,
  getFolders,
  getFolderSummary,
  duplicateItems,
} from "../controllers/item.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { createShare, revokeShare, updateShare } from "../controllers/share.controller.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware.js";
import {
  shareItemParamsSchema,
  updateShareSchema,
} from "../validators/share.validator.js";
import {
  createFolderSchema,
  folderParamsSchema,
  folderQuerySchema,
  itemIdsSchema,
  itemListQuerySchema,
  itemParamsSchema,
  moveItemsSchema,
  renameItemSchema,
  starItemsSchema,
} from "../validators/item.validator.js";

const itemRouter = Router();

itemRouter.use(authenticate);
itemRouter.get("/", validateQuery(itemListQuerySchema), getItems);
itemRouter.get("/folders", validateQuery(folderQuerySchema), getFolders);
itemRouter.get(
  "/folders/:folderId/path",
  validateParams(folderParamsSchema),
  getFolderPath,
);
itemRouter.get("/starred", getStarredItems);
itemRouter.get("/summary", validateQuery(folderQuerySchema), getFolderSummary);
itemRouter.get(
  "/:itemId/download",
  validateParams(itemParamsSchema),
  downloadItem,
);
itemRouter.get(
  "/:itemId/preview",
  validateParams(itemParamsSchema),
  previewItem,
);
itemRouter.get("/:itemId", validateParams(itemParamsSchema), getItem);
itemRouter.post("/folders", validateBody(createFolderSchema), createFolder);
itemRouter.post("/duplicate", validateBody(itemIdsSchema), duplicateItems);
itemRouter.patch("/starred", validateBody(starItemsSchema), starItems);
itemRouter.patch("/move", validateBody(moveItemsSchema), moveItems);
itemRouter.patch(
  "/:itemId",
  validateParams(itemParamsSchema),
  validateBody(renameItemSchema),
  renameItem,
);
itemRouter.post(
  "/:itemId/share",
  validateParams(shareItemParamsSchema),
  createShare,
);
itemRouter.patch(
  "/:itemId/share",
  validateParams(shareItemParamsSchema),
  validateBody(updateShareSchema),
  updateShare,
);
itemRouter.delete(
  "/:itemId/share",
  validateParams(shareItemParamsSchema),
  revokeShare,
);

export default itemRouter;
