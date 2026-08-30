import { PolicyPage, PolicySection, SupportLink } from "@/components/legal/policy-page";
export const metadata = { title: "Cancellation and Refund Policy", description: "DataDock cancellation and refund rules." };
export default function Page() { return <PolicyPage eyebrow="Billing" title="Cancellation and Refund Policy" description="Rules for monthly subscription cancellation, eligibility, and refund timing.">
  <PolicySection title="Cancellation"><p>Cancel from billing settings. Cancellation is scheduled for the end of the paid period, access continues until then, and no later renewal is charged.</p></PolicySection>
  <PolicySection title="Refund eligibility"><p>Fees are generally non-refundable after activation. Contact us within 7 calendar days for a duplicate charge, successful payment without plan activation, or a verified technical billing error.</p></PolicySection>
  <PolicySection title="Request and timing"><p>Email <SupportLink /> from your registered email with the payment or subscription ID, date, amount, and explanation. Never send payment credentials. Approved refunds return through Razorpay to the original method and commonly take 7–10 working days after initiation.</p></PolicySection>
  <PolicySection title="After downgrade"><p>Cancellation does not delete files. If usage exceeds the Free quota, remove content before uploading more.</p></PolicySection>
</PolicyPage>; }
