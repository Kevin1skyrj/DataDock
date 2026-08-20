const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export class ApiError extends Error {
  constructor(message, { code, statusCode }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function apiRequest(
  path,
  { method = "GET", body, headers } = {},
) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is missing");
  }

  const normalizedMethod = method.toUpperCase();
  const response = await fetch(`${API_URL}${path}`, {
    method: normalizedMethod,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(SAFE_METHODS.has(normalizedMethod)
        ? {}
        : { "X-DataDock-Client": "web" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new ApiError(
      payload.error?.message ?? "Request failed",
      {
        code: payload.error?.code ?? "unknown-error",
        statusCode: response.status,
      },
    );
  }

  return payload.data;
}
