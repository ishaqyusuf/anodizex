"use client";

import { LogEvents } from "@anodizex/events";
import { useTrack } from "@anodizex/events/client";
import { Button } from "@anodizex/ui";

export function LandingCTA() {
  const track = useTrack();

  return (
    <section className="relative z-10 max-w-6xl mx-auto w-full px-6 sm:px-8 pb-32 pt-16">
      <div className="bg-card border border-border rounded-2xl p-12 text-center relative overflow-hidden shadow-lg transition-colors duration-300 dark:bg-[#0b100e] dark:border-[#17332d] dark:shadow-[0_24px_80px_rgba(0,155,152,0.14)]">
        <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight text-foreground">
          Put every after-service <br className="sm:hidden" /> promise on one
          board.
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-base">
          Join the free beta, no credit card required. Use the core workflow
          while paid plans and integrations are shaped around real operators.
        </p>
        <a
          href="/signup"
          className="inline-block"
          onClick={() =>
            track({
              event: LogEvents.JoinFreeBeta.name,
              channel: LogEvents.JoinFreeBeta.channel,
              location: "landing_bottom",
            })
          }
        >
          <Button
            size="lg"
            className="h-14 px-8 text-base font-bold shadow-lg shadow-[#009b98]/20"
          >
            Join Free Beta
          </Button>
        </a>
      </div>
    </section>
  );
}
