import { Router } from "express";
import { getStorageSummary } from "../controllers/storage.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const storageRouter = Router();

storageRouter.use(authenticate);
storageRouter.get("/summary", getStorageSummary);

export default storageRouter;
