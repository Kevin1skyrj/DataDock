import { AppError } from "../errors/app-error.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CLIENT_HEADER = "x-datadock-client";
const CLIENT_HEADER_VALUE = "web";

export function protectFromCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (req.get(CLIENT_HEADER) !== CLIENT_HEADER_VALUE) {
    next(
      new AppError("Request could not be verified", {
        statusCode: 403,
        code: "csrf-verification-failed",
      }),
    );
    return;
  }

  next();
}
