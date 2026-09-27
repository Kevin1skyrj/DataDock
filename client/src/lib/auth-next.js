const DEFAULT_DASHBOARD_PATH = "/dashboard";

/**
 * Accept only destinations inside DataDock's authenticated dashboard.
 * Authentication URLs are user-controlled, so this guard also prevents the
 * `next` parameter from becoming an open redirect to another site.
 */
export function safeDashboardNext(value, fallback = DEFAULT_DASHBOARD_PATH) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://datadock.local");
    if (
      url.origin !== "https://datadock.local" ||
      (url.pathname !== "/dashboard" && !url.pathname.startsWith("/dashboard/"))
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function authPath(path, nextPath) {
  const safeNext = safeDashboardNext(nextPath);
  if (safeNext === DEFAULT_DASHBOARD_PATH) return path;

  const params = new URLSearchParams({ next: safeNext });
  return `${path}?${params.toString()}`;
}

