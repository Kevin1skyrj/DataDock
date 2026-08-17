import {
  logout,
  logoutAll,
  resendEmailOtp,
  signIn,
  signUp,
  verifyEmailOtp,
} from "./api/auth";
import {
  continueWithGoogle,
  requestPasswordReset,
  resendOtp as resendMockOtp,
  resetPassword,
  verifyOtp as verifyMockOtp,
} from "./mock/auth";

export {
  continueWithGoogle,
  logout,
  logoutAll,
  requestPasswordReset,
  resetPassword,
  signIn,
  signUp,
};

export function verifyOtp({ flow = "verify", ...attempt }) {
  return flow === "reset"
    ? verifyMockOtp(attempt)
    : verifyEmailOtp(attempt);
}

export function resendOtp({ flow = "verify", ...details }) {
  return flow === "reset"
    ? resendMockOtp(details)
    : resendEmailOtp(details);
}
