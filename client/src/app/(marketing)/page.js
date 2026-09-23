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
 * The fixed header is rendered by the layout. What is left here is the document
 * itself in reading order.
 */
export default function LandingPage() {
  return (
    <>
      <main>
        {/* The preview is the hero's product proof rather than a separate,
            disconnected marketing section. */}
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
