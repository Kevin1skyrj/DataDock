import { Router } from "express";
import {
  trashItems,
  getTrashedItems,
  restoreItems,
} from "../controllers/trash.controller.js";
import { attachDevelopmentUser } from "../middleware/development-user.middleware.js";

const trashRouter = Router();

trashRouter.use(attachDevelopmentUser);
trashRouter.get("/", getTrashedItems);
trashRouter.patch("/restore", restoreItems);
trashRouter.patch("/", trashItems);

export default trashRouter;
