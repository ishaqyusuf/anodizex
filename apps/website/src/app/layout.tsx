import { Provider as AnalyticsProvider } from "@anodizex/events/client";
import { websiteNavItems } from "@anodizex/site-nav";
import { BrandLogo, cn } from "@anodizex/ui";
import { appMetadata } from "@anodizex/utils";
import type { Metadata } from "next";
import { Hedvig_Letters_Sans, Hedvig_Letters_Serif } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { PwaServiceWorkerRegister } from "../components/pwa-service-worker-register";
import { createPageMetadata, siteUrl } from "../lib/seo";
import { TRPCReactProvider } from "../trpc/client";
import "./globals.css";

const hedvigSans = Hedvig_Letters_Sans({
  adjustFontFallback: true,
  display: "optional",
  fallback: ["system-ui", "arial"],
  preload: true,
  subsets: ["latin"],
  variable: "--font-hedvig-sans",
  weight: "400",
});

const hedvigSerif = Hedvig_Letters_Serif({
  adjustFontFallback: true,
  display: "optional",
  fallback: ["Georgia", "Times New Roman", "serif"],
  preload: true,
  subsets: ["latin"],
  variable: "--font-hedvig-serif",
  weight: "400",
});

export const metadata: Metadata = {
  ...createPageMetadata({
    description:
      "Premium aluminium windows, sliding systems, doors, facades, and architectural systems for modern buildings.",
    path: "/",
    title: "Anodizex | Aluminium architectural systems",
  }),
  applicationName: appMetadata.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appMetadata.name,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(siteUrl),
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const hasLandingShell = pathname === "/" || pathname === "/pricing";

  return (
    <html
      lang="en"
      className={cn(
        "font-sans antialiased",
        hedvigSans.variable,
        hedvigSerif.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <TRPCReactProvider>
          <AnalyticsProvider />
          <PwaServiceWorkerRegister />
          {!hasLandingShell && (
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                  <BrandLogo name={appMetadata.name} />
                </Link>
                <nav
                  aria-label="Website navigation"
                  className="hidden md:flex items-center space-x-6 text-sm font-medium"
                >
                  {websiteNavItems.map((item) => (
                    <Link
                      href={item.href}
                      key={item.href}
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </header>
          )}

          <main className="flex-1">{children}</main>

          {!hasLandingShell && (
            <footer className="border-t border-border bg-muted/40">
              <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <BrandLogo name={appMetadata.name} />
                </div>
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <Link
                    href="/pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </Link>
                </div>
              </div>
            </footer>
          )}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
