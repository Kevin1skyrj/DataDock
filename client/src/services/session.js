import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiRequest } from "./api/api-client";

export async function getExistingSession() {
  const cookieHeader = (await cookies()).toString();

  try {
    return await apiRequest("/auth/me", { headers: { Cookie: cookieHeader } });
  } catch (error) {
    // This is only a convenience probe used by the public login/register
    // routes. Failure to confirm a session must not make those routes crash:
    // the form can still render and report a service problem if submission is
    // attempted while the API is unavailable.
    if (error instanceof ApiError) return null;
    throw error;
  }
}

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
