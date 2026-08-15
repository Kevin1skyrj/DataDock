import { CommandShowcase } from "@/components/landing/command-showcase";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { ProductPreview } from "@/components/landing/product-preview";
import { SiteFooter } from "@/components/landing/site-footer";

/**
 * Everything on this page scrolls.
 *
 * The header and the ambient light are rendered by the layout instead, because
 * they must not — see the note there. What is left is the document itself, in
 * reading order.
 */
export default function LandingPage() {
  return (
    <>
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
