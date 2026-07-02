/* biome-ignore-all lint/a11y/noSvgWithoutTitle: Inline icons are decorative and paired with visible text. */
/* biome-ignore-all lint/a11y/useValidAnchor: Hash links navigate to page sections and close the mobile menu. */

import type { PricingResolution } from "@afterservice/plans";
import { LandingCTA } from "./landing/cta";
import { LandingFAQ } from "./landing/faq";
import { LandingFeatures } from "./landing/features";
import { LandingFooter } from "./landing/footer";
import { LandingHeader } from "./landing/header";
import { LandingHero } from "./landing/hero";
import { LandingHowItWorks } from "./landing/how-it-works";
import { LandingMetrics } from "./landing/metrics";
import { MobileLandingPrompts } from "./landing/mobile-landing-prompts";
import { LandingPricing } from "./landing/pricing";

type LaunchedPageProps = {
  initialPricing: PricingResolution;
};

export function LaunchedPage({ initialPricing }: LaunchedPageProps) {
  return (
    <div className="fullscreen-landing relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col justify-between transition-colors duration-300">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <LandingHeader />
      <LandingHero />
      <LandingMetrics />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingPricing initialPricing={initialPricing} />
      <LandingFAQ />
      <LandingCTA />
      <LandingFooter />
      <MobileLandingPrompts />
    </div>
  );
}
