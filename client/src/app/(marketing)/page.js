import { CommandShowcase } from "@/components/landing/command-showcase";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { ProductPreview } from "@/components/landing/product-preview";
import { SiteHeader } from "@/components/landing/site-header";

export default function LandingPage() {
  return (
    <>
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
      </main>
    </>
  );
}
