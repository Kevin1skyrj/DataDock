import { Router } from "express";

import {
  changeUserRole,
  listAllUsers,
  logoutUser,
  permanentlyRemoveUser,
  removeUser,
  unblockUser,
} from "../controllers/admin-user.controller.js";
import { USER_ROLES } from "../config/roles.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { authorizeRoles } from "../middleware/authorize-roles.middleware.js";

const adminUserRouter = Router();

adminUserRouter.use(authenticate, authorizeRoles(USER_ROLES.OWNER));
adminUserRouter.get("/", listAllUsers);
adminUserRouter.patch("/:userId/role", changeUserRole);
adminUserRouter.delete("/:userId/sessions", logoutUser);
adminUserRouter.post("/:userId/unblock", unblockUser);
adminUserRouter.delete("/:userId/permanent", permanentlyRemoveUser);
adminUserRouter.delete("/:userId", removeUser);

export default adminUserRouter;
