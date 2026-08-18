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

const googleDriveRouter = Router();

googleDriveRouter.use(authenticate);
googleDriveRouter.get("/connect", startGoogleDriveConnection);
googleDriveRouter.get("/callback", completeGoogleDriveConnection);
googleDriveRouter.get("/account", getGoogleDriveConnection);
googleDriveRouter.delete("/connection", removeGoogleDriveConnection);
googleDriveRouter.get("/items", getGoogleDriveItems);
googleDriveRouter.post("/jobs", createGoogleDriveImport);
googleDriveRouter.get("/jobs/:jobId", getGoogleDriveImport);

export default googleDriveRouter;
