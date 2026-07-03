"use client";

import { createFollowUpSchema } from "@anodizex/api/schemas";
import {
  Button,
  Calendar,
  ComboboxDropdown,
  type ComboboxItem,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import {
  followUpChannelLabels,
  followUpChannels,
} from "@/hooks/use-follow-up-filter-params";
import { useDashboardInvalidations } from "@/hooks/use-dashboard-invalidations";
import { useFollowUpParams } from "@/hooks/use-follow-up-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const channelOptions = followUpChannels.map((channel) => ({
  label: followUpChannelLabels[channel],
  value: channel,
}));

const EMPTY_OPTION_VALUE = "__empty__";

export function FollowUpCreateForm() {
  const trpc = useTRPC();
  const invalidate = useDashboardInvalidations();
  const { setParams } = useFollowUpParams();

  const { data: customersData, isLoading: isLoadingCustomers } = useQuery(
    trpc.customers.list.queryOptions({
      includeArchived: false,
      limit: 100,
    }),
  );
  const { data: jobsData, isLoading: isLoadingJobs } = useQuery(
    trpc.serviceJobs.list.queryOptions({ limit: 100 }),
  );
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery(
    trpc.templates.list.queryOptions({ limit: 100 }),
  );

  const customers = customersData?.items ?? [];
  const jobs = jobsData?.items ?? [];
  const templates = templatesData?.items ?? [];
  const customerItems = useMemo<ComboboxItem[]>(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        label: customer.name,
      })),
    [customers],
  );

  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);

  const form = useZodForm({
    schema: createFollowUpSchema,
    defaultValues: {
      customerId: "",
      jobId: "",
      templateId: "",
      channel: "email",
      dueAt: defaultDue,
      notes: "",
    },
  });
  const selectedCustomerId = form.watch("customerId");

  const createCustomerMutation = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: ({ item }) => {
        invalidate.customers(item.id);
        form.setValue("customerId", item.id, {
          shouldDirty: true,
          shouldValidate: true,
        });
      },
    }),
  );
  const createFollowUpMutation = useMutation(
    trpc.followUps.create.mutationOptions({
      onSuccess: () => {
        invalidate.followUps();
        form.reset();
        setParams({ createFollowUp: null });
      },
    }),
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          createFollowUpMutation.mutate({
            ...data,
            jobId: data.jobId || undefined,
            templateId: data.templateId || undefined,
          }),
        )}
        className="space-y-6"
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <ComboboxDropdown
                  items={customerItems}
                  selectedItem={customerItems.find(
                    (item) => item.id === field.value,
                  )}
                  onSelect={(item) => field.onChange(item.id)}
                  onCreate={(value) => {
                    const name = value.trim();

                    if (name) {
                      createCustomerMutation.mutate({ name });
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
          <FormField
            control={form.control}
            name="jobId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related job</FormLabel>
                <Select
                  disabled={isLoadingJobs}
                  onValueChange={(value) =>
                    field.onChange(value === EMPTY_OPTION_VALUE ? "" : value)
                  }
                  value={field.value || EMPTY_OPTION_VALUE}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="No job" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={EMPTY_OPTION_VALUE}>No job</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="templateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template</FormLabel>
                <Select
                  disabled={isLoadingTemplates}
                  onValueChange={(value) =>
                    field.onChange(value === EMPTY_OPTION_VALUE ? "" : value)
                  }
                  value={field.value || EMPTY_OPTION_VALUE}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="No template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={EMPTY_OPTION_VALUE}>
                      No template
                    </SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Channel</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {channelOptions.map((option) => (
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
          <FormField
            control={form.control}
            name="dueAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
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
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Draft / notes</FormLabel>
                <FormControl>
                  <Textarea className="resize-y" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={!selectedCustomerId || createFollowUpMutation.isPending}
        >
          {createFollowUpMutation.isPending ? "Adding..." : "Add to board"}
        </Button>
      </form>
    </Form>
  );
}
