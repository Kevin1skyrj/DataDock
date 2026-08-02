import { Hero } from "@/components/landing/hero";
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
      </main>
    </>
  );
}
