"use client";

import { createJobSchema } from "@anodizex/api/schemas";
import {
  Button,
  Calendar,
  ComboboxDropdown,
  type ComboboxItem,
  CurrencyInput,
  Icons,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
} from "@anodizex/ui";
import { cn } from "@anodizex/ui/cn";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@anodizex/ui/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { z } from "zod";
import { QuickFill } from "@/components/quick-fill";
import { useDashboardInvalidations } from "@/hooks/use-dashboard-invalidations";
import { useJobParams } from "@/hooks/use-job-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const NEW_CUSTOMER_ID = "__new_customer__";

const createJobFormSchema = createJobSchema.extend({
  newCustomerEmail: z.string().trim().email().optional().or(z.literal("")),
  newCustomerName: z.string().trim().optional(),
  newCustomerPhone: z.string().trim().optional(),
});

export function JobCreateForm() {
  const trpc = useTRPC();
  const invalidate = useDashboardInvalidations();
  const { setParams } = useJobParams();

  const { data: customersData, isLoading: isLoadingCustomers } = useQuery(
    trpc.customers.list.queryOptions({
      includeArchived: false,
      limit: 100,
    }),
  );
  const customers = customersData?.items ?? [];
  const { data: jobsData } = useQuery(
    trpc.serviceJobs.list.queryOptions({ limit: 100 }),
  );
  const jobs = jobsData?.items ?? [];

  const customerItems = useMemo(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        label: customer.name,
      })),
    [customers],
  );
  const serviceTitleItems = useMemo(
    () => toUniqueComboboxItems(jobs.map((job) => job.title)),
    [jobs],
  );
  const serviceCategoryItems = useMemo(
    () => toUniqueComboboxItems(jobs.map((job) => job.serviceCategory)),
    [jobs],
  );

  const form = useZodForm({
    schema: createJobFormSchema,
    defaultValues: {
      customerId: "",
      title: "",
      serviceCategory: "",
      completedAt: new Date(),
      amountDollars: undefined,
      nextFollowUpAt: undefined,
      newCustomerEmail: "",
      newCustomerName: "",
      newCustomerPhone: "",
      notes: "",
    },
  });
  const selectedCustomerId = form.watch("customerId");
  const newCustomerName = form.watch("newCustomerName");
  const isCreatingNewCustomer = selectedCustomerId === NEW_CUSTOMER_ID;

  const createCustomerMutation = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: ({ item }) => {
        invalidate.customers(item.id);
      },
    }),
  );
  const createJobMutation = useMutation(
    trpc.serviceJobs.create.mutationOptions({
      onSuccess: () => {
        invalidate.serviceJobs();
        form.reset();
        setParams({ createJob: null });
      },
    }),
  );

  const createJob = (
    data: z.infer<typeof createJobFormSchema>,
    customerId: string,
  ) => {
    createJobMutation.mutate({
      amountCents: data.amountDollars
        ? Math.round(data.amountDollars * 100)
        : undefined,
      completedAt: data.completedAt,
      customerId,
      nextFollowUpAt: data.nextFollowUpAt,
      notes: data.notes,
      serviceCategory: data.serviceCategory,
      title: data.title,
    });
  };

  const onSubmit = (data: z.infer<typeof createJobFormSchema>) => {
    if (data.customerId === NEW_CUSTOMER_ID) {
      const name = data.newCustomerName?.trim();

      if (!name) {
        form.setError("newCustomerName", {
          message: "Customer name is required",
        });
        return;
      }

      createCustomerMutation.mutate(
        {
          email: data.newCustomerEmail,
          name,
          phone: data.newCustomerPhone,
        },
        {
          onSuccess: ({ item }) => {
            form.setValue("customerId", item.id, {
              shouldDirty: true,
              shouldValidate: true,
            });
            createJob(data, item.id);
          },
        },
      );
      return;
    }

    createJob(data, data.customerId);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <div className="flex justify-end">
          <QuickFill name="job" args={{ customers }} />
        </div>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <ComboboxDropdown
                  items={customerItems}
                  selectedItem={
                    isCreatingNewCustomer
                      ? {
                          id: NEW_CUSTOMER_ID,
                          label: newCustomerName || "New customer",
                        }
                      : customerItems.find((item) => item.id === field.value)
                  }
                  onSelect={(item) => {
                    field.onChange(item.id);
                    form.setValue("newCustomerName", "", {
                      shouldDirty: true,
                    });
                    form.setValue("newCustomerEmail", "", {
                      shouldDirty: true,
                    });
                    form.setValue("newCustomerPhone", "", {
                      shouldDirty: true,
                    });
                  }}
                  onCreate={(value) => {
                    const name = value.trim();

                    if (name) {
                      form.setValue("customerId", NEW_CUSTOMER_ID, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      form.setValue("newCustomerName", name, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  createPosition="first"
                  disabled={
                    isLoadingCustomers || createCustomerMutation.isPending
                  }
                  placeholder="Select or create customer"
                  searchPlaceholder="Search customers..."
                  renderOnCreate={(value) => `Create "${value}"`}
                  triggerClassName="h-9 bg-transparent"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {isCreatingNewCustomer ? (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="newCustomerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="newCustomerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newCustomerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ) : null}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service title</FormLabel>
                <ComboboxDropdown
                  items={serviceTitleItems}
                  selectedItem={toSelectedComboboxItem(field.value)}
                  onSelect={(item) => field.onChange(item.label)}
                  onCreate={(value) => {
                    const title = value.trim();

                    if (title) {
                      field.onChange(title);
                    }
                  }}
                  createPosition="first"
                  placeholder="Select or create service title"
                  searchPlaceholder="Maintenance, repair, installation..."
                  renderOnCreate={(value) => `Create "${value}"`}
                  triggerClassName="h-9 bg-transparent"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="serviceCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (optional)</FormLabel>
                  <ComboboxDropdown
                    items={serviceCategoryItems}
                    selectedItem={toSelectedComboboxItem(field.value)}
                    onSelect={(item) => field.onChange(item.label)}
                    onCreate={(value) => {
                      const category = value.trim();

                      if (category) {
                        field.onChange(category);
                      }
                    }}
                    createPosition="first"
                    placeholder="Select or create category"
                    searchPlaceholder="HVAC maintenance, detailing..."
                    renderOnCreate={(value) => `Create "${value}"`}
                    triggerClassName="h-9 bg-transparent"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="completedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Completed date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value instanceof Date
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                          <Icons.CalendarMonth className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value instanceof Date ? field.value : undefined
                        }
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amountDollars"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (optional)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      placeholder="250"
                      value={field.value ?? ""}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextFollowUpAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next follow-up (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value instanceof Date
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                          <Icons.CalendarMonth className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value instanceof Date ? field.value : undefined
                        }
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          disabled={
            !selectedCustomerId ||
            (isCreatingNewCustomer && !newCustomerName?.trim()) ||
            createCustomerMutation.isPending ||
            createJobMutation.isPending
          }
          type="submit"
          className="w-full"
        >
          {createCustomerMutation.isPending || createJobMutation.isPending
            ? "Creating job..."
            : "Create job"}
        </Button>
      </form>
    </Form>
  );
}

function toUniqueComboboxItems(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values.flatMap((value) => {
        const label = value?.trim();

        return label ? [label] : [];
      }),
    ),
  )
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      id: value,
      label: value,
    })) satisfies ComboboxItem[];
}

function toSelectedComboboxItem(value: string | null | undefined) {
  const label = value?.trim();

  if (!label) return undefined;

  return {
    id: label,
    label,
  };
}
