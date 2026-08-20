import { Router } from "express";
import { quickSearchItems, searchItems } from "../controllers/search.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { validateQuery } from "../middleware/validate.middleware.js";
import { searchQuerySchema } from "../validators/search.validator.js";

const searchRouter = Router();

searchRouter.use(authenticate);
searchRouter.get("/quick", validateQuery(searchQuerySchema), quickSearchItems);
searchRouter.get("/", validateQuery(searchQuerySchema), searchItems);

export default searchRouter;
