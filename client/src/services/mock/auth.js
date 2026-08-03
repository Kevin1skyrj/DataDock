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

/**
 * The real thing hands off to Google and comes back; there is nothing to hand
 * off to yet, so this only proves the pending state renders.
 */
export async function continueWithGoogle() {
  await wait(900);
  return asUser("demo@datadock.app");
}
