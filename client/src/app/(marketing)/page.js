import { PageAtmosphere } from "@/components/common/page-atmosphere";
import { CommandShowcase } from "@/components/landing/command-showcase";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { ProductPreview } from "@/components/landing/product-preview";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function LandingPage() {
  return (
    <>
      {/* One light for the whole page, behind every section. Fixed, so it
          drifts rather than scrolls, and fades up only as the hero's own
          stronger light leaves. */}
      <PageAtmosphere />

      <SiteHeader />
      <main>
        {/* The preview renders inside the hero so it shares one light,
            parallax and entrance system rather than starting a new section. */}
        <Hero>
          <ProductPreview />
        </Hero>

        <HowItWorks />
        <CommandShowcase />
        <Features />
        <Pricing />
        <FinalCta />
      </main>

      <SiteFooter />
    </>
  );
}
