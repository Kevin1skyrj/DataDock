import { redirect } from "next/navigation";

import { requireSession } from "@/services/session";

export default async function AdminPage() {
  const session = await requireSession();

  redirect(session.role === "owner" ? "/dashboard/admin/users" : "/dashboard");
}
