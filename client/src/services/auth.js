import {
  changePassword,
  logout,
  logoutAll,
  requestPasswordReset,
  resetPassword,
  resendEmailOtp,
  signIn,
  signUp,
  verifyEmailOtp,
  verifyPasswordResetOtp,
} from "./api/auth";
import { continueWithGoogle } from "./api/google-auth";

export {
  continueWithGoogle,
  changePassword,
  logout,
  logoutAll,
  requestPasswordReset,
  resetPassword,
  signIn,
  signUp,
};

export function verifyOtp({ flow = "verify", ...attempt }) {
  return flow === "reset"
    ? verifyPasswordResetOtp(attempt)
    : verifyEmailOtp(attempt);
}

export function resendOtp({ flow = "verify", ...details }) {
  return flow === "reset"
    ? requestPasswordReset(details)
    : resendEmailOtp(details);
}
