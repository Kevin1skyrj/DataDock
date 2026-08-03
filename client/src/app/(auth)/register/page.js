import Link from "next/link";

import { AuthPanel } from "@/components/auth/auth-panel";
import { RegisterForm } from "@/components/auth/register-form";
import { REGISTER } from "@/constants/auth";

export const metadata = {
  title: "Create your account",
  description: "Start with 5 GB of DataDock, free forever.",
};

export default function RegisterPage() {
  return (
    <AuthPanel
      title={REGISTER.title}
      description={REGISTER.description}
      footer={
        <>
          {REGISTER.alternative.prompt}{" "}
          <Link
            href={REGISTER.alternative.href}
            className="rounded-xs font-medium text-foreground transition-colors duration-200 ease-standard hover:text-brand"
          >
            {REGISTER.alternative.label}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthPanel>
  );
}
