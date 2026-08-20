import { ZodError } from "zod";

import { AppError } from "../errors/app-error.js";

export function validateBody(schema) {
  return validate("body", schema);
}

export function validateParams(schema) {
  return validate("params", schema);
}

function validate(source, schema) {
  return function validateRequest(req, res, next) {
    try {
      req[source] = schema.parse(req[source]);
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
