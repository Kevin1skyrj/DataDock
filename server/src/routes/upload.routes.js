import { Router } from "express";

import {
  completeUpload,
  createUpload,
} from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const uploadRouter = Router();

uploadRouter.use(authenticate);
uploadRouter.post("/", createUpload);
uploadRouter.post("/:uploadId/complete", completeUpload);

export default uploadRouter;
