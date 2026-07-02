"use client";

import { LogEvents } from "@afterservice/events";
import { useTrack } from "@afterservice/events/client";
import { Button } from "@afterservice/ui";
import { ArrowRight } from "lucide-react";

export function LandingHero() {
  const track = useTrack();

  const showPricing = () => {
    track({
      event: LogEvents.PricingViewed.name,
      channel: LogEvents.PricingViewed.channel,
      location: "landing_hero",
    });

    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 pt-20 pb-16 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eef8f0] border border-[#009b98]/25 text-sm text-[#17232b] font-medium mb-8 transition-colors duration-300 dark:bg-[#0c1815] dark:text-[#dff8ee] dark:border-[#009b98]/35">
        <span className="w-2 h-2 rounded-full bg-[#009b98] animate-pulse" />
        <span>Free early access for service operators</span>
      </div>

      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-5xl mx-auto leading-[1.05]">
        One board for every <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009b98] via-[#4bbbaa] to-[#a9d3b7]">
          post-job follow-up
        </span>
      </h1>

      <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
        afterservice helps repair shops, installers, contractors, and local
        service teams remember every customer check-in, review-safe request,
        issue follow-up, referral ask, and repeat-service reminder.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto text-base h-14 px-8 font-bold shadow-lg shadow-[#009b98]/20 flex items-center justify-center gap-2"
        >
          <a
            href="/signup"
            className="w-full sm:w-auto"
            onClick={() =>
              track({
                event: LogEvents.JoinFreeBeta.name,
                channel: LogEvents.JoinFreeBeta.channel,
                location: "landing_hero",
              })
            }
          >
            Join Free Beta
            <ArrowRight className="w-5 h-5 ml-1" />
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto text-base h-14 px-8 font-bold"
          onClick={showPricing}
        >
          See Pricing & Plans
        </Button>
      </div>

      {/* Dashboard Showcase Mockup */}
      <div className="relative max-w-5xl mx-auto bg-card border border-border rounded-2xl p-4 shadow-xl backdrop-blur-sm overflow-hidden group transition-colors duration-300 dark:bg-[#0b100e] dark:border-[#17332d] dark:shadow-[0_24px_80px_rgba(0,155,152,0.14)]">
        {/* Decorative browser dots */}
        <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-4 text-xs text-muted-foreground font-mono">
            dashboard.afterservice.app
          </span>
        </div>

        {/* Dummy UI Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          <div className="md:col-span-1 border-r border-border pr-4 hidden md:flex flex-col gap-3 text-xs text-muted-foreground">
            <div className="p-2 rounded bg-[#eef8f0] text-[#17232b] font-bold dark:bg-[#0c1815] dark:text-[#dff8ee]">
              Follow-Up Board
            </div>
            <div className="p-2 hover:bg-[#eef8f0]/50 dark:hover:bg-[#122118]/40 rounded transition-colors">
              Customers
            </div>
            <div className="p-2 hover:bg-[#eef8f0]/50 dark:hover:bg-[#122118]/40 rounded transition-colors">
              Jobs & Tickets
            </div>
            <div className="p-2 hover:bg-[#eef8f0]/50 dark:hover:bg-[#122118]/40 rounded transition-colors">
              Templates
            </div>
            <div className="p-2 hover:bg-[#eef8f0]/50 dark:hover:bg-[#122118]/40 rounded transition-colors">
              Settings
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="font-bold text-primary">
                Active Follow-Up Pipeline
              </h4>
              <span className="text-xs text-muted-foreground">
                Updated just now
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-card border border-border p-3 rounded-xl flex flex-col justify-between min-h-32">
                <div>
                  <span className="text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-500 px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/40">
                    DUE TODAY
                  </span>
                  <h5 className="font-bold text-sm mt-2 text-foreground">
                    HVAC Maintenance
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    John Doe - Rapid Cooling
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-muted-foreground">
                    Call reminder
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                </div>
              </div>

              <div className="bg-card border border-border p-3 rounded-xl flex flex-col justify-between min-h-32">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-[#009b98]/20">
                    SENT
                  </span>
                  <h5 className="font-bold text-sm mt-2 text-foreground">
                    Plumbing Install
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Sarah Smith - Shower Leak
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-muted-foreground">
                    Sent 2h ago
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
              </div>

              <div className="bg-card border border-border p-3 rounded-xl flex flex-col justify-between min-h-32">
                <div>
                  <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-500 px-2 py-0.5 rounded bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40">
                    REPLIED
                  </span>
                  <h5 className="font-bold text-sm mt-2 text-foreground">
                    Electrical Panel
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Robert Lee - Breaker Box
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">
                    Customer replied
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
