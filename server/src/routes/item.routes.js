import {Router} from 'express';
import { getItems } from '../controllers/item.controller.js';
import { attachDevelopmentUser } from '../middleware/development-user.middleware.js';

const itemRouter = Router();
itemRouter.use(attachDevelopmentUser);
itemRouter.get('/', getItems);
export default itemRouter;