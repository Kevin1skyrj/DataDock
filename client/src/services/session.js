import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiRequest } from "./api/api-client";

export async function requireSession() {
  const cookieHeader = (await cookies()).toString();

  try {
    return await apiRequest("/auth/me", {
      headers: {
        Cookie: cookieHeader,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      redirect("/login");
    }

    throw error;
  }
}
