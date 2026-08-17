/**
 * Mock authentication.
 *
 * Stands in for the API until the backend exists. It is deliberately
 * deterministic rather than random: the point of a mock is that every state the
 * UI can be in — including the ugly ones — is reachable on demand, and a
 * failure you cannot reproduce is a failure you cannot design for.
 *
 * Sign in with any address and any password to succeed. The reserved addresses
 * below each fail in a different way; they are the only special cases.
 */

/** Long enough that the pending state is visible and worth designing. */
const LATENCY = 720;

const wait = (ms = LATENCY) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A failure the form can act on.
 *
 * `field` is the name of the input to blame, or null when the problem belongs
 * to the submission as a whole. The form reads it to decide between a message
 * under one field and a message above all of them, and to move focus somewhere
 * useful — which is the difference between an error you can fix and an error
 * you have to hunt for.
 */
export class AuthError extends Error {
  constructor(message, { field = null, code = "unknown" } = {}) {
    super(message);
    this.name = "AuthError";
    this.field = field;
    this.code = code;
  }
}

const SIGN_IN_FAILURES = {
  "unknown@datadock.app": {
    field: "email",
    code: "no-account",
    message: "No DataDock account uses this email address.",
  },
  "wrong@datadock.app": {
    field: "password",
    code: "bad-password",
    message: "That password isn't right. Try again, or reset it.",
  },
  "unverified@datadock.app": {
    field: null,
    code: "unverified",
    message: "This account hasn't been verified yet. Check your inbox for the code we sent.",
  },
  "locked@datadock.app": {
    field: null,
    code: "locked",
    message: "Too many attempts. Try again in a few minutes.",
  },
};

const asUser = (email) => ({
  id: "usr_mock",
  email,
  name: email.split("@")[0],
});

/**
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ id: string, email: string, name: string }>}
 * @throws {AuthError}
 */
export async function signIn({ email }) {
  await wait();

  const failure = SIGN_IN_FAILURES[email.trim().toLowerCase()];
  if (failure) throw new AuthError(failure.message, failure);

  return asUser(email.trim());
}

const SIGN_UP_FAILURES = {
  "taken@datadock.app": {
    field: "email",
    code: "email-taken",
    message: "An account already uses this email address.",
  },
  "blocked@datadock.app": {
    field: null,
    code: "blocked",
    message: "We can't create an account for this address. Contact support if that seems wrong.",
  },
};

/**
 * Creates the account and leaves it unverified — the code goes out, and the
 * visitor is handed to the verification screen. Nothing is signed in yet, which
 * is the whole reason that screen exists.
 *
 * @param {{ name: string, email: string, password: string }} details
 * @returns {Promise<{ id: string, email: string, name: string, verified: false }>}
 * @throws {AuthError}
 */
export async function signUp({ name, email }) {
  await wait();

  const failure = SIGN_UP_FAILURES[email.trim().toLowerCase()];
  if (failure) throw new AuthError(failure.message, failure);

  return { ...asUser(email.trim()), name: name.trim(), verified: false };
}

/* ------------------------------------------------------------ the code -- */

/** Any six digits are accepted except these two, which fail on purpose. */
const OTP_FAILURES = {
  "000000": {
    code: "otp-invalid",
    message: "That code isn't right. Check it and try again.",
  },
  "111111": {
    code: "otp-expired",
    message: "That code has expired. Send yourself a new one.",
  },
};

/**
 * Confirms a code, whether it came from registering or from a reset request.
 *
 * Returns a token because the reset flow needs one: the screen that sets a new
 * password has to be able to prove a code was checked, or it is a page anyone
 * can open and change any account from.
 *
 * @param {{ email: string, code: string }} attempt
 * @returns {Promise<{ token: string }>}
 * @throws {AuthError}
 */
export async function verifyOtp({ code }) {
  await wait();

  const failure = OTP_FAILURES[code];
  if (failure) throw new AuthError(failure.message, { field: "code", code: failure.code });

  return { token: `rst_${Math.random().toString(36).slice(2, 12)}` };
}

export async function resendOtp({ email }) {
  await wait(500);
  return { sentTo: email };
}

/**
 * Sends a reset code — and resolves the same way whether or not an account
 * exists.
 *
 * Reporting "no account uses this address" here would turn an anonymous form
 * into an account enumeration oracle: anyone could stand outside and learn who
 * has a DataDock account. `signIn` can afford to be specific because the person
 * asking has already produced a password; this form has nothing to go on.
 */
export async function requestPasswordReset({ email }) {
  await wait();
  return { sentTo: email };
}

/**
 * @param {{ email: string, token: string, password: string }} change
 * @throws {AuthError} when the token is missing or was never issued
 */
export async function resetPassword({ token }) {
  await wait();

  if (!token) {
    throw new AuthError("This reset link is no longer valid.", { code: "bad-token" });
  }

  return { ok: true };
}
