import { Router } from "express";
import {
  completeGoogleDriveConnection,
  createGoogleDriveImport,
  getGoogleDriveConnection,
  getGoogleDriveImport,
  getGoogleDriveItems,
  removeGoogleDriveConnection,
  startGoogleDriveConnection,
} from "../controllers/google-drive.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware.js";
import {
  googleDriveImportSchema,
  googleDriveItemsQuerySchema,
  googleDriveJobParamsSchema,
} from "../validators/google-drive.validator.js";

const googleDriveRouter = Router();

googleDriveRouter.use(authenticate);
googleDriveRouter.get("/connect", startGoogleDriveConnection);
googleDriveRouter.get("/callback", completeGoogleDriveConnection);
googleDriveRouter.get("/account", getGoogleDriveConnection);
googleDriveRouter.delete("/connection", removeGoogleDriveConnection);
googleDriveRouter.get(
  "/items",
  validateQuery(googleDriveItemsQuerySchema),
  getGoogleDriveItems,
);
googleDriveRouter.post(
  "/jobs",
  validateBody(googleDriveImportSchema),
  createGoogleDriveImport,
);
googleDriveRouter.get(
  "/jobs/:jobId",
  validateParams(googleDriveJobParamsSchema),
  getGoogleDriveImport,
);

export default googleDriveRouter;
