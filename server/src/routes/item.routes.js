import { Router } from "express";
import { createFolder, getItems } from "../controllers/item.controller.js";
import { attachDevelopmentUser } from "../middleware/development-user.middleware.js";

const itemRouter = Router();
itemRouter.use(attachDevelopmentUser);
itemRouter.get("/", getItems);
itemRouter.post("/folders", createFolder);

export default itemRouter;
