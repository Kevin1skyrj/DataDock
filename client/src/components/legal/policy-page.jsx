import Link from "next/link";
import { SiteFooter } from "@/components/landing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const LEGAL_UPDATED = "30 August 2026";
export const SUPPORT_EMAIL = "rajatpndey257@gmail.com";

const links = [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds", "/refund-policy"], ["Delivery", "/delivery-policy"], ["Security", "/security"], ["Contact", "/contact"]];

export function PolicyPage({ eyebrow, title, description, children }) {
  return <><main className="mx-auto max-w-page px-5 pb-24 pt-36 sm:px-10 sm:pt-44"><header className="mx-auto max-w-3xl"><Badge variant="neutral" pill className="tracking-wider uppercase">{eyebrow}</Badge><h1 className="mt-5 text-display-md font-semibold tracking-tighter text-balance sm:text-display-lg">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-[1.65] text-muted-foreground">{description}</p><p className="mt-3 text-sm text-dim">Last updated: {LEGAL_UPDATED}</p></header><Card as="article" variant="raised" padding="lg" className="legal-copy mx-auto mt-10 max-w-3xl">{children}</Card><nav aria-label="Legal and support pages" className="mx-auto mt-8 flex max-w-3xl flex-wrap gap-x-5 gap-y-2 text-sm">{links.map(([label, href]) => <Link key={href} href={href} className="text-muted-foreground transition-colors hover:text-brand">{label}</Link>)}</nav></main><SiteFooter /></>;
}

export function PolicySection({ title, children }) { return <section><h2>{title}</h2>{children}</section>; }
export function SupportLink() { return <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>; }
