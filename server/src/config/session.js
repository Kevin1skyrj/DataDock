export const SESSION_COOKIE_NAME = "datadock_session";

const production = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  secure: production,
  sameSite: "lax",
  // A `.datadock.me` cookie is valid for the production frontend and API
  // subdomain, but browsers reject it when the server runs on localhost.
  domain: production ? process.env.COOKIE_DOMAIN || undefined : undefined,
  path: "/",
};
