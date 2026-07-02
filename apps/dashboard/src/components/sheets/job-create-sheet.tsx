"use client";

import { Sheet } from "@afterservice/ui";
import { JobCreateForm } from "@/components/forms/job-create-form";
import { useJobParams } from "@/hooks/use-job-params";
import { DashboardSheetContent } from "./dashboard-sheet-content";

export function JobCreateSheet() {
  const { createJob, setParams } = useJobParams();

  return (
    <Sheet
      open={createJob ?? false}
      onOpenChange={(isOpen) => setParams({ createJob: isOpen ? true : null })}
    >
      <DashboardSheetContent
        title="Log completed job"
        description="Record completed service work and queue the next follow-up."
      >
        <JobCreateForm />
      </DashboardSheetContent>
    </Sheet>
  );
}
