import { Router } from "express";

import {
  completeUpload,
  createUpload,
} from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import {
  validateBody,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  completeUploadParamsSchema,
  createUploadSchema,
} from "../validators/upload.validator.js";

const uploadRouter = Router();

uploadRouter.use(authenticate);
uploadRouter.post("/", validateBody(createUploadSchema), createUpload);
uploadRouter.post(
  "/:uploadId/complete",
  validateParams(completeUploadParamsSchema),
  completeUpload,
);

export default uploadRouter;
