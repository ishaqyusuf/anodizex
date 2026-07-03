"use client";

import { LogEvents } from "@anodizex/events";
import { useTrack } from "@anodizex/events/client";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export function MobileJoinBetaSheet({
  isSuppressed = false,
}: {
  isSuppressed?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const track = useTrack();

  useEffect(() => {
    let frame = 0;

    const updateVisibility = () => {
      frame = 0;
      const scrollTop = Math.max(
        window.scrollY,
        document.documentElement.scrollTop,
      );

      setIsVisible(scrollTop > window.innerHeight * 1.5);
    };

    const onScroll = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateVisibility);
    };

    updateVisibility();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateVisibility);
    document.addEventListener("scroll", onScroll, { passive: true });

    const interval = window.setInterval(updateVisibility, 250);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.clearInterval(interval);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateVisibility);
      document.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={[
        "mobile-beta-sheet md:hidden fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40",
        "rounded-[18px] bg-[#0a0a0a]/95 px-4 py-3 text-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45),0_2px_8px_-2px_rgba(0,0,0,0.3)] backdrop-blur-md",
        "flex min-h-[69px] items-center justify-between gap-4",
        "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
        isSuppressed && "hidden",
        isVisible && !isSuppressed
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!isVisible || isSuppressed}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
          Free Beta
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-tight text-white">
          No credit card required
        </p>
      </div>

      <a
        href="/signup"
        onClick={() =>
          track({
            event: LogEvents.JoinFreeBeta.name,
            channel: LogEvents.JoinFreeBeta.channel,
            location: "mobile_sticky_beta_sheet",
          })
        }
        className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-sm font-bold text-[#0a0a0a] shadow-sm transition-colors hover:bg-[#eef8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
      >
        Join Beta
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
