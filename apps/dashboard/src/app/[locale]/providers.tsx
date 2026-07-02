"use client";

import type { ReactNode } from "react";
import { GlobalModalsProvider } from "@/components/modals/global-modals-provider";
import { GlobalSheetsProvider } from "@/components/sheets/global-sheets-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import { TRPCReactProvider } from "@/trpc/client";

type ProvidersProps = {
  children: ReactNode;
  locale: string;
};

export function Providers({ children, locale }: ProvidersProps) {
  return (
    <TRPCReactProvider>
      <I18nProviderClient locale={locale}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalSheetsProvider />
          <GlobalModalsProvider />
          {children}
        </ThemeProvider>
      </I18nProviderClient>
    </TRPCReactProvider>
  );
}
