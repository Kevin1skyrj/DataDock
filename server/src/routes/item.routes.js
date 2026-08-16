import { Router } from "express";
import {
  createFolder,
  getFolderPath,
  getItem,
  getItems,
} from "../controllers/item.controller.js";
import { attachDevelopmentUser } from "../middleware/development-user.middleware.js";

const itemRouter = Router();
itemRouter.use(attachDevelopmentUser);
itemRouter.get("/", getItems);
itemRouter.get("/folders/:folderId/path", getFolderPath);
itemRouter.get("/:itemId", getItem);
itemRouter.post("/folders", createFolder);

export default itemRouter;
