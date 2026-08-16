import { Router } from "express";
import itemRouter from "./item.routes.js";
const apiRouter = Router();
apiRouter.use('/items', itemRouter);
export default apiRouter;