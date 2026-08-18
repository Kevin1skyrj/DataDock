import { Router } from "express";
import {
  getLargestFiles,
  getStorageBreakdown,
  getStorageSummary,
  getStorageActivity,
  getCleanupSuggestions,
} from "../controllers/storage.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const storageRouter = Router();

storageRouter.use(authenticate);
storageRouter.get("/summary", getStorageSummary);
storageRouter.get("/breakdown", getStorageBreakdown);
storageRouter.get("/largest", getLargestFiles);
storageRouter.get("/activity", getStorageActivity);
storageRouter.get("/cleanup", getCleanupSuggestions);

export default storageRouter;
