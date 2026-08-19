import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiRequest } from "./api/api-client";

export async function requireSession() {
  const cookieHeader = (await cookies()).toString();

  try {
    const headers = { Cookie: cookieHeader };
    const [account, billing] = await Promise.all([
      apiRequest("/auth/me", { headers }),
      apiRequest("/billing/current", { headers }),
    ]);

    return { ...account, plan: billing.plan.name };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      redirect("/login");
    }

    throw error;
  }
}
