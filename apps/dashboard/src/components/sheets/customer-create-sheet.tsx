"use client";

import { Sheet } from "@anodizex/ui";
import { CustomerCreateForm } from "@/components/forms/customer-create-form";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { DashboardSheetContent } from "./dashboard-sheet-content";

export function CustomerCreateSheet() {
  const { createCustomer, setParams } = useCustomerParams();

  return (
    <Sheet
      open={createCustomer ?? false}
      onOpenChange={(isOpen) =>
        setParams({ createCustomer: isOpen ? true : null })
      }
    >
      <DashboardSheetContent
        title="Add customer"
        description="Create a customer profile for service history and follow-ups."
      >
        <CustomerCreateForm />
      </DashboardSheetContent>
    </Sheet>
  );
}
