"use client";

import { LogEvents } from "@afterservice/events";
import { useTrack } from "@afterservice/events/client";
import {
  getLocalizedPlanPrice,
  type PricingResolution,
} from "@afterservice/plans";
import { Button, Card } from "@afterservice/ui";
import { Check } from "lucide-react";
import { publicPlans } from "./pricing-data";

type LandingPricingProps = {
  initialPricing: PricingResolution;
};

export function LandingPricing({ initialPricing }: LandingPricingProps) {
  const pricing = initialPricing;
  const track = useTrack();

  return (
    <section
      id="pricing"
      className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 py-24"
    >
      <div className="text-center mb-14">
        <span className="text-xs font-bold text-primary tracking-widest uppercase">
          Free beta now
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
          Start free while afterservice is in early access.
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Paid plans are planned for teams that need more volume, integrations,
          automation, reporting, and support. Beta users get founder-rate
          pricing when paid plans launch.
        </p>
        {pricing.note && (
          <p className="mt-6 text-xs text-muted-foreground">{pricing.note}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-stretch max-w-7xl mx-auto">
        {publicPlans.map((plan) => {
          const price = getLocalizedPlanPrice(plan.id, pricing);

          return (
            <Card
              key={plan.name}
              className={`p-6 rounded-2xl flex flex-col justify-between shadow-sm dark:shadow-none backdrop-blur-sm ${
                plan.current
                  ? "border-2 border-[#009b98] bg-primary/5"
                  : "bg-card"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-primary tracking-widest uppercase">
                    {plan.current ? "Current" : "Planned"}
                  </span>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {plan.buyer}
                  </span>
                </div>

                <h3 className="text-2xl font-bold mt-4 text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 min-h-16">
                  {plan.description}
                </p>

                <div className="my-6">
                  <span className="text-5xl font-extrabold text-foreground">
                    {price.formattedMonthly}
                  </span>
                  <span className="block text-sm text-muted-foreground mt-1">
                    {plan.priceNote}
                  </span>
                  {!plan.current && price.formattedYearly && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      {price.formattedYearly}/year planned
                    </span>
                  )}
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                    Includes
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          className="w-4 h-4 text-primary shrink-0 mt-0.5"
                          strokeWidth={3}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border pt-5 mt-5">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                    Limits
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {plan.limits.map((limit) => (
                      <li key={limit}>{limit}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {plan.current ? (
                  <a
                    href="/signup"
                    className="block w-full"
                    onClick={() =>
                      track({
                        event: LogEvents.JoinFreeBeta.name,
                        channel: LogEvents.JoinFreeBeta.channel,
                        location: "pricing_card",
                        plan: plan.name,
                      })
                    }
                  >
                    <Button className="w-full h-12 font-bold shadow-md shadow-[#009b98]/20">
                      {plan.cta}
                    </Button>
                  </a>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-primary font-bold"
                    onClick={() =>
                      track({
                        event: LogEvents.PlannedPaidPlanInterest.name,
                        channel: LogEvents.PlannedPaidPlanInterest.channel,
                        currency: price.currency,
                        location: "pricing_card",
                        plan: plan.name,
                        pricingRegion: pricing.region,
                      })
                    }
                  >
                    {plan.cta}
                  </Button>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  {plan.billingNote}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
