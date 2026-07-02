"use client";

import { Sheet } from "@afterservice/ui";
import { useQuery } from "@tanstack/react-query";
import { FollowUpWorkForm } from "@/components/forms/follow-up-work-form";
import { useFollowUpParams } from "@/hooks/use-follow-up-params";
import { useTRPC } from "@/trpc/client";
import { DashboardSheetContent } from "./dashboard-sheet-content";
import { SheetFormSkeleton } from "./sheet-form-skeleton";
import { SheetMissingState } from "./sheet-missing-state";

export function FollowUpCardSheet() {
  const trpc = useTRPC();
  const { followUpId, setParams } = useFollowUpParams();
  const followUpQueryId = followUpId ?? "";

  const { data: followUpData, isLoading } = useQuery(
    trpc.followUps.get.queryOptions(
      { id: followUpQueryId },
      { enabled: !!followUpId },
    ),
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) setParams(null);
  };

  return (
    <Sheet open={!!followUpId} onOpenChange={handleOpenChange}>
      <DashboardSheetContent
        bodyClassName=""
        title="Work follow-up"
        description="Update the state of this follow-up."
      >
        {isLoading ? (
          <SheetFormSkeleton fields={6} />
        ) : followUpData?.item ? (
          <FollowUpWorkForm followUp={followUpData.item} />
        ) : (
          <SheetMissingState
            title="Follow-up not found"
            description="This follow-up may have been completed, archived, or removed."
            onClose={() => setParams(null)}
          />
        )}
      </DashboardSheetContent>
    </Sheet>
  );
}
