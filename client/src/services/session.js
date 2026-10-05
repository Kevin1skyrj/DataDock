import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiRequest } from "./api/api-client";

export async function getExistingSession() {
  const cookieHeader = (await cookies()).toString();

  try {
    return await apiRequest("/auth/me", { headers: { Cookie: cookieHeader } });
  } catch {
    // This is only a convenience probe used by the public login/register
    // routes. Failure to confirm a session must not make those routes crash:
    // the form can still render and report a service problem if submission is
    // attempted while the API is unavailable.
    return null;
  }
}

export async function requireSession() {
  const cookieHeader = (await cookies()).toString();
  const headers = { Cookie: cookieHeader };

  try {
    const account = await apiRequest("/auth/me", { headers });

    // Billing decorates the shell; it must never become an authentication
    // dependency. A provider/configuration problem should affect the Billing
    // screen, not prevent an otherwise valid user from opening their drive.
    try {
      const billing = await apiRequest("/billing/current", { headers });
      return { ...account, plan: billing.plan.name };
    } catch {
      return { ...account, plan: account.plan ?? "Free" };
    }
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      redirect("/login");
    }

    throw error;
  }
}
