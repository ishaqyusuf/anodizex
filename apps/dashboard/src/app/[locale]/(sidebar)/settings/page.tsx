import type { Metadata } from "next";
import { ChangeTheme } from "@/components/change-theme";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { UpdateWorkspaceForm } from "@/components/forms/update-workspace-form";
import { ScrollableContent } from "@/components/scrollable-content";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Settings | afterservice",
  description: "Manage workspace settings.",
};

export default async function SettingsPage() {
  await prefetch(trpc.workspace.getCurrent.queryOptions());

  return (
    <HydrateClient>
      <ScrollableContent>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <div className="max-w-[800px] space-y-12">
            <UpdateWorkspaceForm />
            <ChangeTheme />
          </div>
        </ErrorBoundary>
      </ScrollableContent>
    </HydrateClient>
  );
}
