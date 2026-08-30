import { PolicyPage, PolicySection, SUPPORT_EMAIL } from "@/components/legal/policy-page";
export const metadata = { title: "Contact", description: "Contact DataDock support." };
export default function Page() { return <PolicyPage eyebrow="Support" title="Contact DataDock" description="Get help with your account, files, subscription, privacy request, or security concern.">
  <PolicySection title="Email"><p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p><p>Write from your registered address for account requests. Include relevant IDs and screenshots, but never passwords, OTPs, private keys, or payment credentials.</p></PolicySection>
  <PolicySection title="Operator"><p>DataDock is operated by Rajat Pandey, an individual developer based in India. Support is handled by email. Begin urgent report subjects with “Security”.</p></PolicySection>
</PolicyPage>; }
