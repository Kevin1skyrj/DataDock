import { VerifyEmail } from "@/components/auth/verify-email";

export const metadata = {
  title: "Verify your email",
  description: "Enter the code we sent you.",
};

/**
 * Read on the server rather than through `useSearchParams`, which would force
 * the screen behind a Suspense boundary and leave the window empty for a beat
 * while it resolved. The address travels in the URL so a reload does not strand
 * someone on a screen that no longer knows who it is for.
 */
export default async function VerifyEmailPage({ searchParams }) {
  const params = await searchParams;

  const email = typeof params.email === "string" ? params.email : "";
  const flow = params.flow === "reset" ? "reset" : "verify";

  return <VerifyEmail email={email} flow={flow} />;
}
