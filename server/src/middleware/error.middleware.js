import { AppError } from "../errors/app-error.js";
import { logError } from "../utils/log-error.js";

export function notFound(req, res, next) {
  next(
    new AppError("Route not found", {
      statusCode: 404,
      code: "route-not-found",
    }),
  );
}

export function errorHandler(error, req, res, next) {
  const invalidJson = error.type === "entity.parse.failed";
  const bodyTooLarge = error.type === "entity.too.large";
  const duplicateResource = error.code === 11000;
  const duplicateName = duplicateResource && error.keyPattern?.normalizedName;
  const statusCode = duplicateResource
    ? 409
    : bodyTooLarge
    ? 413
    : invalidJson
      ? 400
      : Number.isInteger(error.statusCode)
        ? error.statusCode
        : 500;

  if (statusCode >= 500) {
    logError("Request failed", error);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: bodyTooLarge
        ? "request-too-large"
        : invalidJson
          ? "invalid-json"
          : duplicateResource
            ? duplicateName ? "name-conflict" : "resource-conflict"
          : error.code ?? "internal-error",
      message:
        statusCode >= 500
          ? "Something went wrong on the server"
          : duplicateResource
            ? duplicateName
              ? "An item with this name already exists in this location"
              : "A conflicting record already exists"
          : bodyTooLarge
            ? "Request body is too large"
            : invalidJson
              ? "Request body contains invalid JSON"
              : error.message,
    },
  });
}
