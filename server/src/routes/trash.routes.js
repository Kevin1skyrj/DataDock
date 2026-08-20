import { Router } from "express";
import {
  trashItems,
  getTrashedItems,
  restoreItems,
  permanentlyDeleteItems,
  emptyTrash,
} from "../controllers/trash.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { itemIdsSchema } from "../validators/item.validator.js";

const trashRouter = Router();

trashRouter.use(authenticate);
trashRouter.get("/", getTrashedItems);
trashRouter.patch("/restore", validateBody(itemIdsSchema), restoreItems);
trashRouter.patch("/", validateBody(itemIdsSchema), trashItems);
trashRouter.delete("/all", emptyTrash);
trashRouter.delete("/", validateBody(itemIdsSchema), permanentlyDeleteItems);

export default trashRouter;
