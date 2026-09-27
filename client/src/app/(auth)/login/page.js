import Link from "next/link";

import { AuthPanel } from "@/components/auth/auth-panel";
import { LoginForm } from "@/components/auth/login-form";
import { LOGIN } from "@/constants/auth";
import { authPath, safeDashboardNext } from "@/lib/auth-next";

export const metadata = {
  title: "Log in",
  description: "Sign in to your DataDock drive.",
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const nextPath = safeDashboardNext(params.next);

  return (
    <AuthPanel
      title={LOGIN.title}
      description={LOGIN.description}
      footer={
        <>
          {LOGIN.alternative.prompt}{" "}
          <Link
            href={authPath(LOGIN.alternative.href, nextPath)}
            className="rounded-xs font-medium text-foreground transition-colors duration-200 ease-standard hover:text-brand"
          >
            {LOGIN.alternative.label}
          </Link>
        </>
      }
    >
      <LoginForm nextPath={nextPath} />
    </AuthPanel>
  );
}
