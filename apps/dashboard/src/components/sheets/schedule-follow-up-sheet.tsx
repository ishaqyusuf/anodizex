"use client";

import { Sheet } from "@afterservice/ui";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { ScheduleFollowUpForm } from "@/components/forms/schedule-follow-up-form";
import { useTRPC } from "@/trpc/client";
import { DashboardSheetContent } from "./dashboard-sheet-content";
import { SheetFormSkeleton } from "./sheet-form-skeleton";
import { SheetMissingState } from "./sheet-missing-state";

export function ScheduleFollowUpSheet() {
  const trpc = useTRPC();
  const [jobId, setJobId] = useQueryState("schedule_follow_up");
  const jobQueryId = jobId ?? "";

  const { data: jobData, isLoading: isLoadingJob } = useQuery(
    trpc.serviceJobs.get.queryOptions({ id: jobQueryId }, { enabled: !!jobId }),
  );

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery(
    trpc.templates.list.queryOptions({ limit: 100 }, { enabled: !!jobId }),
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) setJobId(null);
  };

  const templates = templatesData?.items ?? [];

  return (
    <Sheet open={!!jobId} onOpenChange={handleOpenChange}>
      <DashboardSheetContent
        bodyClassName=""
        title="Schedule follow-up"
        description={
          jobData?.item
            ? `Create a follow-up action for ${jobData.item.title}.`
            : "Create a follow-up action for this service job."
        }
      >
        {isLoadingJob || isLoadingTemplates ? (
          <SheetFormSkeleton fields={4} />
        ) : jobData?.item ? (
          <ScheduleFollowUpForm
            job={jobData.item}
            templates={templates}
            onSuccess={() => setJobId(null)}
          />
        ) : (
          <SheetMissingState
            title="Job not found"
            description="This service job may have been archived or removed."
            onClose={() => setJobId(null)}
          />
        )}
      </DashboardSheetContent>
    </Sheet>
  );
}
