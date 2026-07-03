"use client";

import { Sheet } from "@anodizex/ui";
import { FollowUpCreateForm } from "@/components/forms/follow-up-create-form";
import { useFollowUpParams } from "@/hooks/use-follow-up-params";
import { DashboardSheetContent } from "./dashboard-sheet-content";

export function FollowUpCreateSheet() {
  const { createFollowUp, setParams } = useFollowUpParams();

  return (
    <Sheet
      open={createFollowUp ?? false}
      onOpenChange={(isOpen) =>
        setParams({ createFollowUp: isOpen ? true : null })
      }
    >
      <DashboardSheetContent
        title="Create follow-up"
        description="Schedule the next customer touchpoint after a completed service."
      >
        <FollowUpCreateForm />
      </DashboardSheetContent>
    </Sheet>
  );
}
