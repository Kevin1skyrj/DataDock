import Link from "next/link";

import { AuthPanel } from "@/components/auth/auth-panel";
import { RegisterForm } from "@/components/auth/register-form";
import { REGISTER } from "@/constants/auth";
import { authPath, safeDashboardNext } from "@/lib/auth-next";

export const metadata = {
  title: "Create your account",
  description: "Start with 500 MB of DataDock, free forever.",
};

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const nextPath = safeDashboardNext(params.next);

  return (
    <AuthPanel
      title={REGISTER.title}
      description={REGISTER.description}
      footer={
        <>
          {REGISTER.alternative.prompt}{" "}
          <Link
            href={authPath(REGISTER.alternative.href, nextPath)}
            className="rounded-xs font-medium text-foreground transition-colors duration-200 ease-standard hover:text-brand"
          >
            {REGISTER.alternative.label}
          </Link>
        </>
      }
    >
      <RegisterForm nextPath={nextPath} />
    </AuthPanel>
  );
}
