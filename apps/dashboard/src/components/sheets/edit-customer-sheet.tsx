"use client";

import { Sheet } from "@anodizex/ui";
import { useQuery } from "@tanstack/react-query";
import { CustomerEditForm } from "@/components/forms/customer-edit-form";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useTRPC } from "@/trpc/client";
import { DashboardSheetContent } from "./dashboard-sheet-content";
import { SheetFormSkeleton } from "./sheet-form-skeleton";
import { SheetMissingState } from "./sheet-missing-state";

export function EditCustomerSheet() {
  const trpc = useTRPC();
  const { customerId, setParams } = useCustomerParams();
  const customerQueryId = customerId ?? "";

  const { data: customerData, isLoading } = useQuery(
    trpc.customers.get.queryOptions(
      { id: customerQueryId },
      { enabled: !!customerId },
    ),
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) setParams(null);
  };

  return (
    <Sheet open={!!customerId} onOpenChange={handleOpenChange}>
      <DashboardSheetContent
        bodyClassName=""
        title="Edit customer"
        description="Update customer details or archive this record."
      >
        {isLoading ? (
          <SheetFormSkeleton fields={6} />
        ) : customerData?.item ? (
          <CustomerEditForm customer={customerData.item} />
        ) : (
          <SheetMissingState
            title="Customer not found"
            description="This customer may have been archived or removed."
            onClose={() => setParams(null)}
          />
        )}
      </DashboardSheetContent>
    </Sheet>
  );
}
