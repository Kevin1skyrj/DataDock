import { AuthError } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MESSAGE_TYPE = "datadock:google-auth";

const ERROR_MESSAGES = {
  "google-login-cancelled": "Google login was cancelled.",
  "google-oauth-invalid": "The Google login request expired. Please try again.",
  "google-account-conflict": "This Google account cannot be connected.",
};

export function continueWithGoogle() {
  if (!API_URL) {
    return Promise.reject(new Error("NEXT_PUBLIC_API_URL is missing"));
  }

  const width = 520;
  const height = 680;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

  const popup = window.open(
    `${API_URL}/auth/google`,
    "datadock-google-login",
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );

  if (!popup) {
    return Promise.reject(
      new AuthError("Allow popups for DataDock to continue with Google.", {
        code: "popup-blocked",
      }),
    );
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", receiveMessage);
      window.clearInterval(closedCheck);
      callback();
    };

    const receiveMessage = (event) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        event.data?.type !== MESSAGE_TYPE
      ) {
        return;
      }

      if (event.data.status === "success") {
        finish(resolve);
        return;
      }

      const code = event.data.code ?? "google-authentication-failed";
      finish(() =>
        reject(
          new AuthError(
            ERROR_MESSAGES[code] ?? "Google login failed. Please try again.",
            { code },
          ),
        ),
      );
    };

    const closedCheck = window.setInterval(() => {
      if (popup.closed) {
        finish(() =>
          reject(
            new AuthError("Google login was cancelled.", {
              code: "popup-closed",
            }),
          ),
        );
      }
    }, 500);

    window.addEventListener("message", receiveMessage);
    popup.focus();
  });
}
