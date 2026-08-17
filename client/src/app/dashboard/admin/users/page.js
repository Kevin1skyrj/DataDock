import { redirect } from "next/navigation";

import { AdminUsers } from "./users";
import { requireSession } from "@/services/session";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const session = await requireSession();

  if (session.role !== "owner") {
    redirect("/dashboard");
  }

  return <AdminUsers />;
}
