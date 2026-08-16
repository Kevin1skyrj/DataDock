import { Router } from "express";
import {
  createFolder,
  getFolderPath,
  getItem,
  getItems,
  renameItem,
  starItems,
  getStarredItems,
} from "../controllers/item.controller.js";
import { attachDevelopmentUser } from "../middleware/development-user.middleware.js";

const itemRouter = Router();
itemRouter.use(attachDevelopmentUser);
itemRouter.get("/", getItems);
itemRouter.get("/folders/:folderId/path", getFolderPath);
itemRouter.get("/starred", getStarredItems);
itemRouter.get("/:itemId", getItem);
itemRouter.post("/folders", createFolder);
itemRouter.patch("/starred", starItems);
itemRouter.patch("/:itemId", renameItem);

export default itemRouter;
