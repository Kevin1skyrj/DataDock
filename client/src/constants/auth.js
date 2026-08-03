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

/** Six digits: long enough to be safe to email, short enough to hold in your head. */
export const OTP_LENGTH = 6;

/** How long the resend button waits before it will send another code. */
export const RESEND_SECONDS = 30;

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

export const REGISTER = {
  title: "Create your drive",
  description: "5 GB free, forever. No card, no onboarding call.",

  google: "Continue with Google",
  divider: "or",

  name: {
    label: "Name",
    placeholder: "Ada Lovelace",
  },
  email: {
    label: "Email",
    placeholder: "you@company.com",
  },
  password: {
    label: "Password",
    placeholder: "At least 8 characters",
  },

  submit: "Create account",
  success: "Account created",

  /** Shown once, under the button that agrees to it. */
  legal: {
    prefix: "By creating an account you agree to our",
    terms: { label: "Terms", href: "/terms" },
    conjunction: "and",
    privacy: { label: "Privacy Policy", href: "/privacy" },
  },

  alternative: {
    prompt: "Already have an account?",
    label: "Sign in",
    href: "/login",
  },
};

/**
 * One screen, two errands.
 *
 * A code confirming a new address and a code authorising a password reset are
 * the same interaction — six digits, one inbox, one wrong-address escape hatch.
 * Only the surrounding sentence and where it goes next differ, so those are the
 * only things written twice.
 */
export const VERIFY = {
  verify: {
    title: "Confirm your email",
    lead: "Enter the six-digit code we sent to",
    alternative: { prompt: "Wrong address?", label: "Start over", href: "/register" },
  },
  reset: {
    title: "Check your email",
    lead: "Enter the six-digit code we sent to",
    alternative: { prompt: "Wrong address?", label: "Try another", href: "/forgot-password" },
  },

  fallbackEmail: "your email address",
  label: "Verification code",
  submit: "Verify",
  success: "Verified",

  resend: {
    prompt: "Didn't get it?",
    idle: "Resend code",
    sent: "Code sent",
  },
};

export const FORGOT = {
  title: "Reset your password",
  description: "Give us the address on your account and we'll send a code to it.",

  email: {
    label: "Email",
    placeholder: "you@company.com",
  },

  submit: "Send code",
  success: "Code sent",

  alternative: {
    prompt: "Remembered it?",
    label: "Back to sign in",
    href: "/login",
  },
};

export const RESET = {
  title: "Choose a new password",
  description: "Pick something you haven't used here before.",
  /** Used instead of the above once we know whose account this is. */
  forEmail: "Setting a new password for",

  password: {
    label: "New password",
    placeholder: "At least 8 characters",
  },

  submit: "Update password",

  /** Reached by opening this screen without having verified a code first. */
  expired: {
    title: "This link has expired",
    description: "Reset codes are good for a short while only. Start again and we'll send a fresh one.",
    action: { label: "Request a new code", href: "/forgot-password" },
  },
};

/**
 * The end of each flow.
 *
 * Deliberately a place you arrive rather than a message that flashes past. Both
 * of these are the last moment of something that took several screens, and the
 * one thing a visitor wants at that moment is to be told plainly that it
 * worked, then handed a door.
 */
export const SUCCESS = {
  verified: {
    title: "You're all set",
    description: "Your email is confirmed and your drive is ready.",
    action: { label: "Open your drive", href: "/dashboard" },
  },
  reset: {
    title: "Password updated",
    description: "Your new password is live. Use it to sign in.",
    action: { label: "Sign in", href: "/login" },
  },
};

/**
 * The password meter's four rungs.
 *
 * Named rather than scored out of ten: "Fair" is something a person can act on,
 * "6/10" is a number they have to interpret. The tones are the product's own
 * status colours, so the meter agrees with every other signal in the app about
 * what bad, adequate and good look like.
 */
export const PASSWORD_LEVELS = [
  { label: "Weak", tone: "bg-error", text: "text-error" },
  { label: "Fair", tone: "bg-warning", text: "text-warning" },
  { label: "Good", tone: "bg-brand", text: "text-brand" },
  { label: "Strong", tone: "bg-success", text: "text-success" },
];
