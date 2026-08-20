import { ZodError } from "zod";

import { AppError } from "../errors/app-error.js";

export function validateBody(schema) {
  return validate("body", schema);
}

export function validateParams(schema) {
  return validate("params", schema);
}

export function validateQuery(schema) {
  return function validateRequestQuery(req, res, next) {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      handleValidationError(error, next);
    }
  };
}

function validate(source, schema) {
  return function validateRequest(req, res, next) {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (error) {
      handleValidationError(error, next);
    }
  };
}

function handleValidationError(error, next) {
  if (error instanceof ZodError) {
    next(
      new AppError(error.issues[0]?.message ?? "Request is invalid", {
        statusCode: 400,
        code: "invalid-request",
      }),
    );
    return;
  }

  next(error);
}
