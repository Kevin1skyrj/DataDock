import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is missing from environment variables");
}

if (!emailFrom) {
  throw new Error("EMAIL_FROM is missing from environment variables");
}

const resend = new Resend(resendApiKey);

export async function sendVerificationOtpEmail({ to, code }) {
  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject: "Verify your DataDock email",
    text: [
      `Your DataDock verification code is: ${code}`,
      "",
      "This code expires in 10 minutes.",
      "If you did not create a DataDock account, ignore this email.",
    ].join("\n"),
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}