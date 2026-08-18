import { Router } from "express";
import {
  trashItems,
  getTrashedItems,
  restoreItems,
  permanentlyDeleteItems,
  emptyTrash,
} from "../controllers/trash.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const trashRouter = Router();

trashRouter.use(authenticate);
trashRouter.get("/", getTrashedItems);
trashRouter.patch("/restore", restoreItems);
trashRouter.patch("/", trashItems);
trashRouter.delete("/all", emptyTrash);
trashRouter.delete("/", permanentlyDeleteItems);

export default trashRouter;
