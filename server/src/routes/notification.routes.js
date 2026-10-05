import { Router } from "express";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { listNotifications, markAllRead } from "../controllers/notification.controller.js";

const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get("/", listNotifications);
notificationRouter.patch("/read", markAllRead);
export default notificationRouter;
