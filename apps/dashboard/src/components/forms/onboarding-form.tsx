"use client";

import { onboardingSchema } from "@anodizex/api/schemas";
import { LogEvents } from "@anodizex/events";
import { useTrack } from "@anodizex/events/client";
import {
  Button,
  ComboboxDropdown,
  type ComboboxItem,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@anodizex/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@anodizex/ui/form";
import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import type { z } from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import {
  BUSINESS_TYPE_SUGGESTIONS,
  DEFAULT_SERVICE_CATEGORY_SUGGESTIONS,
  getBusinessTypeId,
  getSelectedSuggestion,
  SERVICE_CATEGORY_SUGGESTIONS_BY_BUSINESS_TYPE,
  toCustomSuggestion,
} from "@/lib/onboarding-suggestions";

const followUpDelayOptions = [
  { label: "3 days", value: "3" },
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
  { label: "30 days", value: "30" },
] as const;

const onboardingSkeletonFields = [
  "business-name",
  "business-type",
  "service-category",
  "follow-up-delay",
] as const;

export function OnboardingForm() {
  const [error, setError] = useState<string | null>(null);
  const track = useTrack();

  const form = useZodForm({
    schema: onboardingSchema,
    defaultValues: {
      businessName: "",
      businessType: "",
      serviceCategory: "",
      defaultFollowUpDelayDays: 7,
    },
  });

  async function onSubmit(data: z.infer<typeof onboardingSchema>) {
    setError(null);

    const response = await fetch("/api/onboarding", {
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (response.status === 401) {
      window.location.href = "/sign-in";
      return;
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setError(payload?.error ?? "Workspace setup failed.");
      return;
    }

    track({
      event: LogEvents.WorkspaceCreated.name,
      channel: LogEvents.WorkspaceCreated.channel,
    });

    window.location.href = "/";
  }

  const isPending = form.formState.isSubmitting;
  const businessType = form.watch("businessType");
  const serviceCategory = form.watch("serviceCategory");
  const businessTypeId = getBusinessTypeId(businessType);
  const serviceCategorySuggestions = useMemo(
    () =>
      (businessTypeId
        ? SERVICE_CATEGORY_SUGGESTIONS_BY_BUSINESS_TYPE[businessTypeId]
        : undefined) ?? DEFAULT_SERVICE_CATEGORY_SUGGESTIONS,
    [businessTypeId],
  );
  const selectedBusinessType = getSelectedSuggestion(
    BUSINESS_TYPE_SUGGESTIONS,
    businessType,
  );
  const selectedServiceCategory = getSelectedSuggestion(
    serviceCategorySuggestions,
    serviceCategory,
  );

  function setBusinessType(item: ComboboxItem) {
    form.setValue("businessType", item.label, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("serviceCategory", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function createBusinessType(value: string) {
    const customBusinessType = toCustomSuggestion(value);

    if (customBusinessType.label) {
      setBusinessType(customBusinessType);
    }
  }

  function setServiceCategory(item: ComboboxItem) {
    form.setValue("serviceCategory", item.label, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function createServiceCategory(value: string) {
    const customServiceCategory = toCustomSuggestion(value);

    if (customServiceCategory.label) {
      setServiceCategory(customServiceCategory);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="businessType"
            render={() => (
              <FormItem>
                <FormLabel>Business type</FormLabel>
                <ComboboxDropdown
                  items={[...BUSINESS_TYPE_SUGGESTIONS]}
                  selectedItem={selectedBusinessType}
                  onSelect={setBusinessType}
                  onCreate={createBusinessType}
                  placeholder="Select or create a business type"
                  searchPlaceholder="Repair shop, clinic, salon..."
                  renderOnCreate={(value) => `Use "${value}"`}
                  triggerClassName="h-9 bg-transparent"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceCategory"
            render={() => (
              <FormItem>
                <FormLabel>Service category</FormLabel>
                <ComboboxDropdown
                  items={serviceCategorySuggestions}
                  selectedItem={selectedServiceCategory}
                  onSelect={setServiceCategory}
                  onCreate={createServiceCategory}
                  placeholder="Select or create a service category"
                  searchPlaceholder="Appliance repair, maintenance..."
                  renderOnCreate={(value) => `Use "${value}"`}
                  triggerClassName="h-9 bg-transparent"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultFollowUpDelayDays"
            render={({ field }) => (
              <FormItem>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FormLabel className="inline-flex w-fit items-center gap-1.5">
                        Default follow-up delay
                        <Info
                          aria-hidden="true"
                          className="size-3.5 text-muted-foreground"
                        />
                      </FormLabel>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64 text-balance">
                      How many days after a completed job afterservice uses as
                      the starting due date for new follow-ups. You can change
                      individual follow-ups later.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delay" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {followUpDelayOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {error ? (
          <p className="text-[0.8rem] font-medium text-destructive">{error}</p>
        ) : null}
        <Button disabled={isPending} type="submit" className="w-full">
          {isPending ? "Creating workspace..." : "Create workspace"}
        </Button>
      </form>
    </Form>
  );
}

export function OnboardingFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {onboardingSkeletonFields.map((field) => (
          <div key={field} className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
