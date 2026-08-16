import { Router } from "express";
import itemRouter from "./item.routes.js";
import trashRouter from "./trash.routes.js";
const apiRouter = Router();
apiRouter.use("/items", itemRouter);
apiRouter.use("/trash", trashRouter)
export default apiRouter;