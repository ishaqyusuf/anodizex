"use client";

import { Sheet } from "@anodizex/ui";
import { TemplateCreateForm } from "@/components/forms/template-create-form";
import { useTemplateParams } from "@/hooks/use-template-params";
import { DashboardSheetContent } from "./dashboard-sheet-content";

export function TemplateCreateSheet() {
  const { createTemplate, setParams } = useTemplateParams();

  return (
    <Sheet
      open={createTemplate ?? false}
      onOpenChange={(isOpen) =>
        setParams({ createTemplate: isOpen ? true : null })
      }
    >
      <DashboardSheetContent
        title="Create template"
        description="Add a reusable follow-up message for completed service work."
      >
        <TemplateCreateForm />
      </DashboardSheetContent>
    </Sheet>
  );
}
