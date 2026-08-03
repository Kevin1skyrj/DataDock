import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
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
        <Features />
      </main>
    </>
  );
}
