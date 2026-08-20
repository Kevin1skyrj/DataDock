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
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware.js";
import {
  adminRoleSchema,
  adminUserListQuerySchema,
  adminUserParamsSchema,
} from "../validators/admin-user.validator.js";

const adminUserRouter = Router();

adminUserRouter.use(authenticate, authorizeRoles(USER_ROLES.OWNER));
adminUserRouter.get("/", validateQuery(adminUserListQuerySchema), listAllUsers);
adminUserRouter.patch(
  "/:userId/role",
  validateParams(adminUserParamsSchema),
  validateBody(adminRoleSchema),
  changeUserRole,
);
adminUserRouter.delete(
  "/:userId/sessions",
  validateParams(adminUserParamsSchema),
  logoutUser,
);
adminUserRouter.post(
  "/:userId/unblock",
  validateParams(adminUserParamsSchema),
  unblockUser,
);
adminUserRouter.delete(
  "/:userId/permanent",
  validateParams(adminUserParamsSchema),
  permanentlyRemoveUser,
);
adminUserRouter.delete(
  "/:userId",
  validateParams(adminUserParamsSchema),
  removeUser,
);

export default adminUserRouter;
