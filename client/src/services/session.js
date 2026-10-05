import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiRequest } from "./api/api-client";

export async function requireSession({ includeStorage = false } = {}) {
  const cookieHeader = (await cookies()).toString();

  try {
    const headers = { Cookie: cookieHeader };
    const [account, billing, initialStorage] = await Promise.all([
      apiRequest("/auth/me", { headers }),
      apiRequest("/billing/current", { headers }),
      includeStorage
        ? apiRequest("/storage/summary", { headers }).catch(() => null)
        : Promise.resolve(null),
    ]);

    return { ...account, plan: billing.plan.name, initialStorage };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      redirect("/login");
    }

    throw error;
  }
}
