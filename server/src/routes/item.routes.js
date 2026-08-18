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

const itemRouter = Router();

itemRouter.use(authenticate);
itemRouter.get("/", getItems);
itemRouter.get("/folders", getFolders);
itemRouter.get("/folders/:folderId/path", getFolderPath);
itemRouter.get("/starred", getStarredItems);
itemRouter.get("/summary", getFolderSummary);
itemRouter.get("/:itemId/download", downloadItem);
itemRouter.get("/:itemId/preview", previewItem);
itemRouter.get("/:itemId", getItem);
itemRouter.post("/folders", createFolder);
itemRouter.post("/duplicate", duplicateItems);
itemRouter.patch("/starred", starItems);
itemRouter.patch("/move", moveItems);
itemRouter.patch("/:itemId", renameItem);
itemRouter.post("/:itemId/share", createShare);
itemRouter.patch("/:itemId/share", updateShare);
itemRouter.delete("/:itemId/share", revokeShare);

export default itemRouter;
