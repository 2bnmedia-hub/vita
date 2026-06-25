import { Suspense } from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { InstagramSection } from "@/components/sections/InstagramSection";
import AboutSection from "@/components/sections/AboutSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <TestimonialsSection />
      <CtaBanner />
      <AboutSection />
      <InstagramSection />
    </>
  );
}

function ProductsSkeleton() {
  return (
    <section className="py-24 bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-10 w-64 rounded-xl bg-navy-800 animate-pulse mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-navy-800 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}
