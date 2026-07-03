"use client";

import { LogEvents } from "@anodizex/events";
import { useTrack } from "@anodizex/events/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function SignupCompletionTracker() {
  const hasTrackedRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const track = useTrack();

  useEffect(() => {
    if (
      hasTrackedRef.current ||
      searchParams.get("signup_method") !== "google"
    ) {
      return;
    }

    hasTrackedRef.current = true;
    track({
      event: LogEvents.SignUpCompleted.name,
      channel: LogEvents.SignUpCompleted.channel,
      location: "dashboard_sign_up",
      method: "google",
    });
    router.replace("/onboarding");
  }, [router, searchParams, track]);

  return null;
}
