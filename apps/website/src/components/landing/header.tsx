/* biome-ignore-all lint/a11y/noSvgWithoutTitle: Inline icons are decorative and paired with visible text. */
/* biome-ignore-all lint/a11y/useValidAnchor: Hash links navigate to page sections and close the mobile menu. */

"use client";

import { LogEvents } from "@anodizex/events";
import { useTrack } from "@anodizex/events/client";
import { BrandLogo, Button } from "@anodizex/ui";
import { appMetadata } from "@anodizex/utils";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "light" | "dark";
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:border-[#009b98]/50 hover:bg-[#eef8f0] dark:bg-[#101713] dark:hover:bg-[#122118]"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-[#f3c96a]" />
      ) : (
        <Moon className="h-5 w-5 text-[#009b98]" />
      )}
    </button>
  );
}

export function LandingHeader() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const track = useTrack();

  useEffect(() => {
    const savedTheme =
      typeof window.localStorage === "undefined"
        ? null
        : (window.localStorage.getItem("theme") as "light" | "dark" | null);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem("theme", nextTheme);
    }
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md dark:bg-[#070b09]/86 dark:supports-[backdrop-filter]:bg-[#070b09]/72">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-[72px] flex items-center justify-between">
        <a
          href="/"
          className="inline-flex items-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#009b98]/60"
        >
          <BrandLogo name={appMetadata.name} />
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a
            href="#features"
            className="hover:text-[#18211c] dark:hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#18211c] dark:hover:text-white transition-colors"
          >
            How it Works
          </a>
          <a
            href="#pricing"
            className="hover:text-[#18211c] dark:hover:text-white transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faqs"
            className="hover:text-[#18211c] dark:hover:text-white transition-colors"
          >
            FAQs
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          <a
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-[#18211c] dark:hover:text-white transition-colors"
            onClick={() =>
              track({
                event: LogEvents.CTA.name,
                channel: LogEvents.CTA.channel,
                location: "header_signin",
              })
            }
          >
            Sign In
          </a>
          <a
            href="/signup"
            onClick={() =>
              track({
                event: LogEvents.JoinFreeBeta.name,
                channel: LogEvents.JoinFreeBeta.channel,
                location: "header_signup",
              })
            }
          >
            <Button size="sm">Join Free Beta</Button>
          </a>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:border-[#009b98]/50 hover:bg-[#eef8f0] dark:bg-[#101713] dark:hover:bg-[#122118]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md dark:bg-[#070b09]/95">
          <nav className="flex flex-col gap-1 px-6 py-4">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-[#18211c] dark:hover:text-white hover:bg-[#e9eee6] dark:hover:bg-[#111814] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-[#18211c] dark:hover:text-white hover:bg-[#e9eee6] dark:hover:bg-[#111814] transition-colors"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-[#18211c] dark:hover:text-white hover:bg-[#e9eee6] dark:hover:bg-[#111814] transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-[#18211c] dark:hover:text-white hover:bg-[#e9eee6] dark:hover:bg-[#111814] transition-colors"
            >
              FAQs
            </a>
            <div className="border-t border-border mt-2 pt-4 flex flex-col gap-3 px-4">
              <a
                href="/login"
                onClick={() => {
                  setMobileMenuOpen(false);
                  track({
                    event: LogEvents.CTA.name,
                    channel: LogEvents.CTA.channel,
                    location: "mobile_menu_signin",
                  });
                }}
                className="text-sm font-medium text-muted-foreground hover:text-[#18211c] dark:hover:text-white transition-colors"
              >
                Sign In
              </a>
              <a
                href="/signup"
                onClick={() => {
                  setMobileMenuOpen(false);
                  track({
                    event: LogEvents.JoinFreeBeta.name,
                    channel: LogEvents.JoinFreeBeta.channel,
                    location: "mobile_menu_signup",
                  });
                }}
              >
                <Button size="sm" className="w-full">
                  Join Free Beta
                </Button>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
