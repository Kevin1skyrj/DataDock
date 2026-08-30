import { PolicyPage, PolicySection, SupportLink } from "@/components/legal/policy-page";
export const metadata = { title: "Service Delivery Policy", description: "How DataDock digital subscriptions are delivered." };
export default function Page() { return <PolicyPage eyebrow="Billing" title="Service Delivery Policy" description="DataDock is a digital service. No physical goods are shipped.">
  <PolicySection title="Digital delivery"><p>Free access is enabled after account creation and verification. Paid access is applied electronically to the purchasing account after Razorpay confirms payment.</p></PolicySection>
  <PolicySection title="Timing"><p>Activation is normally immediate, though provider or network delays may postpone confirmation. The upgraded plan and quota then appear in billing and storage settings.</p></PolicySection>
  <PolicySection title="Delivery problems"><p>If payment succeeds without activation, do not pay again. Email <SupportLink /> with your registered email, payment ID, date, and amount.</p></PolicySection>
  <PolicySection title="No shipping"><p>Shipping fees, tracking numbers, and physical delivery timelines do not apply.</p></PolicySection>
</PolicyPage>; }
