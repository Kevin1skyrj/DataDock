import { ResetPassword } from "@/components/auth/reset-password";

export const metadata = {
  title: "Choose a new password",
  description: "Set a new password for your DataDock account.",
};

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;

  const email = typeof params.email === "string" ? params.email : "";
  // Absent means the code screen was skipped. The screen itself decides what
  // that should look like; this only refuses to invent one.
  const token = typeof params.token === "string" ? params.token : "";

  return <ResetPassword email={email} token={token} />;
}
