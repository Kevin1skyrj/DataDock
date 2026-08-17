export const SESSION_COOKIE_NAME = "datadock_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};