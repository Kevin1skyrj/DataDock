import { PolicyPage, PolicySection, SupportLink } from "@/components/legal/policy-page";
export const metadata = { title: "Security", description: "DataDock security practices and reporting." };
export default function Page() { return <PolicyPage eyebrow="Trust" title="Security at DataDock" description="Controls used to protect accounts, files, and service access.">
  <PolicySection title="Accounts"><p>Passwords are bcrypt-hashed. Expiring server-managed sessions, secure cookies, session limits, logout controls, email verification, validation, rate limiting, and security headers add protection.</p></PolicySection>
  <PolicySection title="Files and integrations"><p>Files use a private Amazon S3 bucket with time-limited authorized access. Google Drive access is read-only, consent-based, and its connection credentials are encrypted at rest.</p></PolicySection>
  <PolicySection title="Payments"><p>Razorpay processes payments. DataDock verifies signed responses and webhooks and does not store complete card, bank, UPI PIN, or OTP information.</p></PolicySection>
  <PolicySection title="Report a vulnerability"><p>Email <SupportLink /> with reproducible details. Do not access or disclose other users’ data or perform denial-of-service testing. No internet service can guarantee absolute security.</p></PolicySection>
</PolicyPage>; }
