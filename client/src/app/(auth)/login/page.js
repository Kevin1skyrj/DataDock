import Link from "next/link";

import { AuthPanel } from "@/components/auth/auth-panel";
import { LoginForm } from "@/components/auth/login-form";
import { LOGIN } from "@/constants/auth";

export const metadata = {
  title: "Log in",
  description: "Sign in to your DataDock drive.",
};

export default function LoginPage() {
  return (
    <AuthPanel
      title={LOGIN.title}
      description={LOGIN.description}
      footer={
        <>
          {LOGIN.alternative.prompt}{" "}
          <Link
            href={LOGIN.alternative.href}
            className="rounded-xs font-medium text-foreground transition-colors duration-200 ease-standard hover:text-brand"
          >
            {LOGIN.alternative.label}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthPanel>
  );
}
