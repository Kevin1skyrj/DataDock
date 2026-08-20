import { Router } from "express";
import {
  getLargestFiles,
  getStorageBreakdown,
  getStorageSummary,
  getStorageActivity,
  getCleanupSuggestions,
} from "../controllers/storage.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { validateQuery } from "../middleware/validate.middleware.js";
import { storageLimitQuerySchema } from "../validators/storage.validator.js";

const storageRouter = Router();

storageRouter.use(authenticate);
storageRouter.get("/summary", getStorageSummary);
storageRouter.get("/breakdown", getStorageBreakdown);
storageRouter.get("/largest", validateQuery(storageLimitQuerySchema), getLargestFiles);
storageRouter.get("/activity", validateQuery(storageLimitQuerySchema), getStorageActivity);
storageRouter.get("/cleanup", getCleanupSuggestions);

export default storageRouter;
