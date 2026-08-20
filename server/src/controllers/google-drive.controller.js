import {
  GOOGLE_DRIVE_COOKIE_OPTIONS,
  GOOGLE_DRIVE_STATE_COOKIE,
  GOOGLE_DRIVE_VERIFIER_COOKIE,
} from "../config/google-drive.js";
import { AppError } from "../errors/app-error.js";
import {
  connectGoogleDrive,
  createDriveAuthorizationRequest,
  disconnectGoogleDrive,
  getGoogleDriveAccount,
  getGoogleDriveImportJob,
  listGoogleDriveItems,
  startGoogleDriveImport,
} from "../services/google-drive.service.js";

function clearOAuthCookies(res) {
  const options = { ...GOOGLE_DRIVE_COOKIE_OPTIONS };
  delete options.maxAge;
  res.clearCookie(GOOGLE_DRIVE_STATE_COOKIE, options);
  res.clearCookie(GOOGLE_DRIVE_VERIFIER_COOKIE, options);
}

function callbackUrl(status, code) {
  const url = new URL("/oauth/google-drive/callback", process.env.CLIENT_ORIGIN);
  url.searchParams.set("status", status);
  if (code) url.searchParams.set("code", code);
  return url.toString();
}

export async function startGoogleDriveConnection(req, res, next) {
  try {
    const request = await createDriveAuthorizationRequest();
    res.cookie(GOOGLE_DRIVE_STATE_COOKIE, request.state, GOOGLE_DRIVE_COOKIE_OPTIONS);
    res.cookie(GOOGLE_DRIVE_VERIFIER_COOKIE, request.codeVerifier, GOOGLE_DRIVE_COOKIE_OPTIONS);
    res.redirect(request.authorizationUrl);
  } catch (error) {
    next(error);
  }
}

export async function completeGoogleDriveConnection(req, res) {
  const expectedState = req.signedCookies[GOOGLE_DRIVE_STATE_COOKIE];
  const codeVerifier = req.signedCookies[GOOGLE_DRIVE_VERIFIER_COOKIE];
  clearOAuthCookies(res);

  try {
    const { code, state, error } = req.query;
    if (error) {
      throw new AppError("Google Drive connection was cancelled", {
        statusCode: 400,
        code: "google-drive-cancelled",
      });
    }
    if (
      typeof code !== "string" ||
      typeof state !== "string" ||
      typeof expectedState !== "string" ||
      typeof codeVerifier !== "string" ||
      state !== expectedState
    ) {
      throw new AppError("Google Drive request is invalid or expired", {
        statusCode: 400,
        code: "google-drive-oauth-invalid",
      });
    }
    await connectGoogleDrive({ userId: req.user.id, code, codeVerifier });
    res.redirect(callbackUrl("success"));
  } catch (error) {
    console.error("Google Drive OAuth callback failed:", error.message);
    res.redirect(callbackUrl("error", error.code ?? "google-drive-connection-failed"));
  }
}

export async function getGoogleDriveConnection(req, res, next) {
  try {
    const account = await getGoogleDriveAccount(req.user.id);
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
}

export async function removeGoogleDriveConnection(req, res, next) {
  try {
    await disconnectGoogleDrive(req.user.id);
    res.status(200).json({ success: true, data: { disconnected: true } });
  } catch (error) {
    next(error);
  }
}

export async function getGoogleDriveItems(req, res, next) {
  try {
    const items = await listGoogleDriveItems({
      userId: req.user.id,
      folderId: req.validatedQuery.folderId,
    });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}

export async function createGoogleDriveImport(req, res, next) {
  try {
    const job = await startGoogleDriveImport({
      ownerId: req.user.id,
      fileIds: req.body.fileIds,
      parentId: req.body.parentId,
    });
    res.status(202).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

export async function getGoogleDriveImport(req, res, next) {
  try {
    const job = await getGoogleDriveImportJob({
      ownerId: req.user.id,
      jobId: req.params.jobId,
    });
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}
