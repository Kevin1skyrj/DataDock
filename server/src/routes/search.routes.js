import { Router } from "express";
import { quickSearchItems, searchItems } from "../controllers/search.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const searchRouter = Router();

searchRouter.use(authenticate);
searchRouter.get("/quick", quickSearchItems);
searchRouter.get("/", searchItems);

export default searchRouter;
