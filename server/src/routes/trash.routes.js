import { Router } from "express";
import { trashItems } from "../controllers/trash.controller.js";
import { attachDevelopmentUser } from "../middleware/development-user.middleware.js";

const trashRouter = Router();

trashRouter.use(attachDevelopmentUser);
trashRouter.patch("/", trashItems);

export default trashRouter;