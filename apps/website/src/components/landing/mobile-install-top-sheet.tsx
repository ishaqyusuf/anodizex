"use client";

import { LogEvents } from "@anodizex/events";
import { useTrack } from "@anodizex/events/client";
import { Download, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type InstallOutcome = "accepted" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: InstallOutcome;
    platform: string;
  }>;
};

type FallbackMode = "android-chrome" | "ios-chrome" | "unsupported";
type PromptFailureReason = "prompt_failed" | "prompt_unavailable";

const DISMISSED_UNTIL_KEY = "afterservice:pwa-install-dismissed-until";
const INSTALLED_KEY = "afterservice:pwa-installed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

function getStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in restricted browser modes; install prompting still works.
  }
}

function getInstallSuppression() {
  if (typeof window === "undefined") {
    return true;
  }

  if (getStorageItem(INSTALLED_KEY) === "true") {
    return true;
  }

  const dismissedUntil = Number(getStorageItem(DISMISSED_UNTIL_KEY) ?? 0);

  return Number.isFinite(dismissedUntil) && Date.now() < dismissedUntil;
}

function suppressInstallPrompt() {
  setStorageItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DURATION));
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
    )
  );
}

function getFallbackMode(): FallbackMode | null {
  const userAgent = window.navigator.userAgent;
  const isAndroid = /Android/i.test(userAgent);
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);
  const isChromeIos = /CriOS/i.test(userAgent);
  const isChromeAndroid =
    isAndroid &&
    /Chrome\//i.test(userAgent) &&
    !/EdgA|OPR|SamsungBrowser|Firefox/i.test(userAgent);

  if (isChromeAndroid) {
    return "android-chrome";
  }

  if (isIos && isChromeIos) {
    return "ios-chrome";
  }

  return null;
}

export function MobileInstallTopSheet({
  onVisibilityChange,
}: {
  onVisibilityChange: (isVisible: boolean) => void;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [fallbackMode, setFallbackMode] = useState<FallbackMode | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [promptFailureReason, setPromptFailureReason] =
    useState<PromptFailureReason | null>(null);
  const hasPromptRef = useRef(false);
  const promptShownTracked = useRef(false);
  const unavailableTracked = useRef<string | null>(null);
  const track = useTrack();

  const isVisible = useMemo(
    () => Boolean((deferredPrompt || fallbackMode) && isMobile && !isDismissed),
    [deferredPrompt, fallbackMode, isDismissed, isMobile],
  );

  const promptCopy = useMemo(() => {
    if (promptFailureReason) {
      return {
        subtitle:
          fallbackMode === "ios-chrome"
            ? "Open in Safari to add it to your home screen"
            : "Use Chrome menu, then Add to Home screen",
        title:
          promptFailureReason === "prompt_failed"
            ? "Install prompt did not open"
            : "Install prompt unavailable",
      };
    }

    if (deferredPrompt) {
      return {
        subtitle: "Open faster from your home screen",
        title: "Install afterservice",
      };
    }

    if (fallbackMode === "ios-chrome") {
      return {
        subtitle: "Open in Safari to add it to your home screen",
        title: "Install from Safari",
      };
    }

    return {
      subtitle: "Use Chrome menu, then Add to Home screen",
      title: "Install afterservice",
    };
  }, [deferredPrompt, fallbackMode, promptFailureReason]);

  const trackInstallUnavailable = useCallback(
    (reason: string, mode: FallbackMode | null) => {
      const trackingKey = `${reason}:${mode ?? "unknown"}`;

      if (unavailableTracked.current === trackingKey) {
        return;
      }

      unavailableTracked.current = trackingKey;
      track({
        event: LogEvents.PwaInstallUnavailable.name,
        channel: LogEvents.PwaInstallUnavailable.channel,
        location: "mobile_install_top_sheet",
        mode: mode ?? "unknown",
        reason,
      });
    },
    [track],
  );

  useEffect(() => {
    onVisibilityChange(isVisible);

    if (isVisible && !promptShownTracked.current) {
      promptShownTracked.current = true;
      track({
        event: LogEvents.PwaInstallPromptShown.name,
        channel: LogEvents.PwaInstallPromptShown.channel,
        location: "mobile_install_top_sheet",
        mode: deferredPrompt ? "browser_prompt" : fallbackMode,
      });
    }
  }, [deferredPrompt, fallbackMode, isVisible, onVisibilityChange, track]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setIsMobile(mobileQuery.matches);

    updateMobile();
    mobileQuery.addEventListener("change", updateMobile);

    return () => mobileQuery.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      hasPromptRef.current = true;

      if (getInstallSuppression()) {
        return;
      }

      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setFallbackMode(null);
      setIsDismissed(false);
      setPromptFailureReason(null);
    };

    const onAppInstalled = () => {
      setStorageItem(INSTALLED_KEY, "true");
      setDeferredPrompt(null);
      setIsDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setStorageItem(INSTALLED_KEY, "true");
      setIsDismissed(true);
      return;
    }

    if (!isMobile || getInstallSuppression() || isStandaloneDisplay()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (hasPromptRef.current) {
        return;
      }

      const mode = getFallbackMode();

      if (!mode) {
        return;
      }

      setFallbackMode(mode);
      setPromptFailureReason(null);
      trackInstallUnavailable("beforeinstallprompt_missing", mode);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [isMobile, trackInstallUnavailable]);

  const dismissPrompt = useCallback(
    (reason: string) => {
      suppressInstallPrompt();
      setDeferredPrompt(null);
      setFallbackMode(null);
      setPromptFailureReason(null);
      setIsDismissed(true);
      track({
        event: LogEvents.PwaInstallDismissed.name,
        channel: LogEvents.PwaInstallDismissed.channel,
        location: "mobile_install_top_sheet",
        reason,
      });
    },
    [track],
  );

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      const mode = getFallbackMode() ?? "unsupported";

      setFallbackMode(mode);
      setPromptFailureReason("prompt_unavailable");
      trackInstallUnavailable("install_clicked_without_prompt", mode);
      return;
    }

    if (isPrompting) {
      return;
    }

    setIsPrompting(true);
    setPromptFailureReason(null);
    track({
      event: LogEvents.PwaInstallClicked.name,
      channel: LogEvents.PwaInstallClicked.channel,
      location: "mobile_install_top_sheet",
    });

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setStorageItem(INSTALLED_KEY, "true");
        setIsDismissed(true);
        track({
          event: LogEvents.PwaInstallAccepted.name,
          channel: LogEvents.PwaInstallAccepted.channel,
          location: "mobile_install_top_sheet",
          platform: choice.platform,
        });
      } else {
        suppressInstallPrompt();
        setIsDismissed(true);
        track({
          event: LogEvents.PwaInstallDismissed.name,
          channel: LogEvents.PwaInstallDismissed.channel,
          location: "mobile_install_top_sheet",
          platform: choice.platform,
          reason: "browser_prompt",
        });
      }

      setDeferredPrompt(null);
      setFallbackMode(null);
    } catch {
      const mode = getFallbackMode() ?? "unsupported";

      setDeferredPrompt(null);
      setFallbackMode(mode);
      setPromptFailureReason("prompt_failed");
      track({
        event: LogEvents.PwaInstallFailed.name,
        channel: LogEvents.PwaInstallFailed.channel,
        location: "mobile_install_top_sheet",
        mode,
        reason: "prompt_failed",
      });
    } finally {
      setIsPrompting(false);
    }
  }, [deferredPrompt, isPrompting, track, trackInstallUnavailable]);

  return (
    <div
      className={[
        "md:hidden fixed inset-x-3 top-[calc(4.5rem+0.75rem+env(safe-area-inset-top))] z-40",
        "rounded-[18px] bg-[#0a0a0a]/95 p-3 text-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45),0_2px_8px_-2px_rgba(0,0,0,0.3)] backdrop-blur-md",
        "flex items-center gap-3",
        "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-4 opacity-0",
      ].join(" ")}
      aria-hidden={!isVisible}
      role="status"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-white">
          {promptCopy.title}
        </p>
        <p className="mt-0.5 text-xs font-medium leading-tight text-white/65">
          {promptCopy.subtitle}
        </p>
      </div>

      {deferredPrompt && (
        <button
          type="button"
          onClick={installApp}
          disabled={isPrompting}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-[#0a0a0a] shadow-sm transition-colors hover:bg-[#eef8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-wait disabled:opacity-70"
        >
          {isPrompting ? "Opening..." : "Install now"}
          <Download className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={() => dismissPrompt("manual_close")}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        aria-label="Dismiss install prompt"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
