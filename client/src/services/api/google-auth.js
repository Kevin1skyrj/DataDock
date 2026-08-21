import { AuthError } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MESSAGE_TYPE = "datadock:google-auth";
const CHANNEL_NAME = "datadock:google-auth";

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
    let timeoutId;
    const channel = new BroadcastChannel(CHANNEL_NAME);

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", receiveMessage);
      channel.removeEventListener("message", receiveBroadcast);
      channel.close();
      window.clearTimeout(timeoutId);
      callback();
    };

    const receiveResult = (data) => {
      if (data?.type !== MESSAGE_TYPE) return;

      if (data.status === "success") {
        finish(resolve);
        return;
      }

      const code = data.code ?? "google-authentication-failed";
      finish(() =>
        reject(
          new AuthError(
            ERROR_MESSAGES[code] ?? "Google login failed. Please try again.",
            { code },
          ),
        ),
      );
    };

    const receiveMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== popup) {
        return;
      }

      receiveResult(event.data);
    };

    const receiveBroadcast = (event) => receiveResult(event.data);

    window.addEventListener("message", receiveMessage);
    channel.addEventListener("message", receiveBroadcast);
    timeoutId = window.setTimeout(() => {
      finish(() =>
        reject(
          new AuthError("Google login timed out. Please try again.", {
            code: "google-login-timeout",
          }),
        ),
      );
    }, 10 * 60 * 1000);
    popup.focus();
  });
}
