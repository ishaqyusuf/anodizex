"use client";

import { Sheet } from "@afterservice/ui";
import { useQuery } from "@tanstack/react-query";
import { TemplateEditForm } from "@/components/forms/template-edit-form";
import { useTemplateParams } from "@/hooks/use-template-params";
import { useTRPC } from "@/trpc/client";
import { DashboardSheetContent } from "./dashboard-sheet-content";
import { SheetFormSkeleton } from "./sheet-form-skeleton";
import { SheetMissingState } from "./sheet-missing-state";

export function TemplateSheet() {
  const trpc = useTRPC();
  const { templateId, setParams } = useTemplateParams();
  const templateQueryId = templateId ?? "";

  const { data: templateData, isLoading } = useQuery(
    trpc.templates.get.queryOptions(
      { id: templateQueryId },
      { enabled: !!templateId },
    ),
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) setParams(null);
  };

  return (
    <Sheet open={!!templateId} onOpenChange={handleOpenChange}>
      <DashboardSheetContent
        bodyClassName=""
        title="Edit template"
        description="Update this follow-up template."
      >
        {isLoading ? (
          <SheetFormSkeleton fields={5} />
        ) : templateData?.item ? (
          <TemplateEditForm template={templateData.item} />
        ) : (
          <SheetMissingState
            title="Template not found"
            description="This template may have been archived or removed."
            onClose={() => setParams(null)}
          />
        )}
      </DashboardSheetContent>
    </Sheet>
  );
}
