"use client";

import type { AppRouter } from "@afterservice/api/router";
import {
  Button,
  Calendar,
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
} from "@afterservice/ui";
import { cn } from "@afterservice/ui/cn";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@afterservice/ui/form";
import { useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { format } from "date-fns";
import { useEffect } from "react";
import { z } from "zod";
import { useDashboardInvalidations } from "@/hooks/use-dashboard-invalidations";
import {
  followUpChannelLabels,
  followUpChannels,
} from "@/hooks/use-follow-up-filter-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

type ServiceJob = inferRouterOutputs<AppRouter>["serviceJobs"]["get"]["item"];
type Template =
  inferRouterOutputs<AppRouter>["templates"]["list"]["items"][number];

type Props = {
  job: ServiceJob;
  templates: Template[];
  onSuccess: () => void;
};

const scheduleFollowUpSchema = z.object({
  jobId: z.string().min(1),
  channel: z.enum(["email", "sms", "phone", "whatsapp"]).default("email"),
  dueAt: z.coerce.date(),
  notes: z.string().trim().optional(),
  templateId: z.string().optional(),
});

const channelOptions = followUpChannels.map((channel) => ({
  label: followUpChannelLabels[channel],
  value: channel,
}));

const EMPTY_OPTION_VALUE = "__empty__";

export function ScheduleFollowUpForm({ job, templates, onSuccess }: Props) {
  const trpc = useTRPC();
  const invalidate = useDashboardInvalidations();
  const createFollowUp = useMutation(
    trpc.serviceJobs.createFollowUp.mutationOptions({
      onSuccess: () => {
        invalidate.serviceJobs(job.id);
        invalidate.followUps();
        onSuccess();
      },
    }),
  );

  const form = useZodForm({
    schema: scheduleFollowUpSchema,
    defaultValues: getDefaultValues(job),
  });

  useEffect(() => {
    form.reset(getDefaultValues(job));
  }, [job, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          createFollowUp.mutate({
            ...data,
            templateId: data.templateId || undefined,
          }),
        )}
        className="mt-6 space-y-4"
      >
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
          name="templateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template</FormLabel>
              <Select
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={createFollowUp.isPending}
          className="mt-4 w-full"
        >
          {createFollowUp.isPending ? "Creating..." : "Create follow-up"}
        </Button>
      </form>
    </Form>
  );
}

function getDefaultValues(job: ServiceJob) {
  return {
    jobId: job.id,
    channel: "email" as const,
    dueAt: job.nextFollowUpAt ? new Date(job.nextFollowUpAt) : getDefaultDue(),
    notes: `Follow up about ${job.title}.`,
    templateId: "",
  };
}

function getDefaultDue() {
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);
  return defaultDue;
}
