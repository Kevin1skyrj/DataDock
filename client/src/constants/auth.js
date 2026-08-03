/**
 * Copy for the authentication screens.
 *
 * Kept out of the components for the same reason every other section's copy is:
 * five screens share a voice, and a voice that lives in five JSX files drifts.
 */

export const AUTH_WINDOW = {
  /** Reads in the window's title bar. Same string the product preview uses. */
  address: "datadock.app",
};

export const LOGIN = {
  title: "Welcome back",
  description: "Sign in and pick up exactly where you left off.",

  google: "Continue with Google",
  divider: "or",

  email: {
    label: "Email",
    placeholder: "you@company.com",
  },
  password: {
    label: "Password",
    placeholder: "Your password",
    forgot: "Forgot?",
  },

  submit: "Sign in",
  success: "Signed in",

  alternative: {
    prompt: "New to DataDock?",
    label: "Create an account",
    href: "/register",
  },
};
