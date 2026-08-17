import { AppError } from "../errors/app-error.js";

export function authorizeRoles(...allowedRoles) {
  return function authorize(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", {
          statusCode: 403,
          code: "forbidden",
        }),
      );
    }

    next();
  };
}
