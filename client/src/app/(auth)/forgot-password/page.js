import Link from "next/link";

import { AuthPanel } from "@/components/auth/auth-panel";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FORGOT } from "@/constants/auth";

export const metadata = {
  title: "Reset your password",
  description: "We'll send a code to the address on your account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPanel
      title={FORGOT.title}
      description={FORGOT.description}
      footer={
        <>
          {FORGOT.alternative.prompt}{" "}
          <Link
            href={FORGOT.alternative.href}
            className="rounded-xs font-medium text-foreground transition-colors duration-200 ease-standard hover:text-brand"
          >
            {FORGOT.alternative.label}
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthPanel>
  );
}
