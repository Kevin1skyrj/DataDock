import { ZodError } from "zod";

import { AppError } from "../errors/app-error.js";

export function validateBody(schema) {
  return function validateRequestBody(req, res, next) {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(error.issues[0]?.message ?? "Request body is invalid", {
            statusCode: 400,
            code: "invalid-request",
          }),
        );
        return;
      }

      next(error);
    }
  };
}
