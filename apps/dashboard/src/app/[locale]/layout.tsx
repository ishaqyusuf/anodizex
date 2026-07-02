import { Provider as OpenPanelProvider } from "@afterservice/events/client";
import { cn } from "@afterservice/ui";
import { appMetadata } from "@afterservice/utils";
import type { Metadata } from "next";
import { Hedvig_Letters_Sans, Hedvig_Letters_Serif } from "next/font/google";
import type { ReactNode } from "react";
import "@afterservice/ui/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  description: "The afterservice operator dashboard.",
  title: appMetadata.dashboardTitle,
};

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

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html
      lang={locale}
      className={cn(
        "bg-background font-sans",
        hedvigSans.variable,
        hedvigSerif.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-screen overscroll-none bg-background text-foreground antialiased">
        <Providers locale={locale}>{children}</Providers>
        <OpenPanelProvider />
      </body>
    </html>
  );
}
