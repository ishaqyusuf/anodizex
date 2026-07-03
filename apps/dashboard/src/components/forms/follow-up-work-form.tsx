"use client";

import type { AppRouter } from "@anodizex/api/router";
import {
  Button,
  Calendar,
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
import { useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { format } from "date-fns";
import { useEffect } from "react";
import { z } from "zod";
import { useDashboardInvalidations } from "@/hooks/use-dashboard-invalidations";
import { useFollowUpParams } from "@/hooks/use-follow-up-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { resolveTemplate } from "@/lib/dashboard-format";
import { useTRPC } from "@/trpc/client";

type FollowUp = inferRouterOutputs<AppRouter>["followUps"]["get"]["item"];

type Props = {
  followUp: FollowUp;
};

const rescheduleSchema = z.object({
  id: z.string().min(1),
  dueAt: z.coerce.date(),
});

const manualSendSchema = z.object({
  id: z.string().min(1),
  recipient: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

const markRepliedSchema = z.object({
  id: z.string().min(1),
  notes: z.string().optional(),
});

const closeSchema = z.object({
  id: z.string().min(1),
  notes: z.string().optional(),
});

export function FollowUpWorkForm({ followUp }: Props) {
  const trpc = useTRPC();
  const { setParams } = useFollowUpParams();
  const invalidate = useDashboardInvalidations();

  const handleSuccess = () => {
    invalidate.followUps(followUp.id);
    setParams(null);
  };

  const rescheduleMutation = useMutation(
    trpc.followUps.reschedule.mutationOptions({
      onSuccess: handleSuccess,
    }),
  );
  const markSentMutation = useMutation(
    trpc.followUps.markSent.mutationOptions({
      onSuccess: handleSuccess,
    }),
  );
  const markRepliedMutation = useMutation(
    trpc.followUps.markReplied.mutationOptions({
      onSuccess: handleSuccess,
    }),
  );
  const closeMutation = useMutation(
    trpc.followUps.close.mutationOptions({
      onSuccess: handleSuccess,
    }),
  );

  const rescheduleForm = useZodForm({
    schema: rescheduleSchema,
    defaultValues: {
      id: followUp.id,
      dueAt: new Date(followUp.dueAt),
    },
  });
  const sendForm = useZodForm({
    schema: manualSendSchema,
    defaultValues: getSendDefaultValues(followUp),
  });
  const repliedForm = useZodForm({
    schema: markRepliedSchema,
    defaultValues: { id: followUp.id, notes: "" },
  });
  const closeForm = useZodForm({
    schema: closeSchema,
    defaultValues: { id: followUp.id, notes: "" },
  });

  useEffect(() => {
    rescheduleForm.reset({
      id: followUp.id,
      dueAt: new Date(followUp.dueAt),
    });
    sendForm.reset(getSendDefaultValues(followUp));
    repliedForm.reset({ id: followUp.id, notes: "" });
    closeForm.reset({ id: followUp.id, notes: "" });
  }, [followUp, rescheduleForm, sendForm, repliedForm, closeForm]);

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-medium">Reschedule</h3>
        <Form {...rescheduleForm}>
          <form
            onSubmit={rescheduleForm.handleSubmit((data) =>
              rescheduleMutation.mutate(data),
            )}
            className="space-y-3"
          >
            <FormField
              control={rescheduleForm.control}
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
            <Button
              size="sm"
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={rescheduleMutation.isPending}
            >
              {rescheduleMutation.isPending ? "Rescheduling..." : "Reschedule"}
            </Button>
          </form>
        </Form>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium">Log manual send</h3>
        <Form {...sendForm}>
          <form
            onSubmit={sendForm.handleSubmit((data) =>
              markSentMutation.mutate(data),
            )}
            className="space-y-3"
          >
            <FormField
              control={sendForm.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={sendForm.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={sendForm.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea className="h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              size="sm"
              type="submit"
              className="w-full"
              disabled={markSentMutation.isPending}
            >
              {markSentMutation.isPending ? "Logging..." : "Log manual send"}
            </Button>
          </form>
        </Form>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium">Mark replied</h3>
        <Form {...repliedForm}>
          <form
            onSubmit={repliedForm.handleSubmit((data) =>
              markRepliedMutation.mutate(data),
            )}
            className="space-y-3"
          >
            <FormField
              control={repliedForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reply summary</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              size="sm"
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={markRepliedMutation.isPending}
            >
              {markRepliedMutation.isPending ? "Marking..." : "Mark replied"}
            </Button>
          </form>
        </Form>
      </section>

      <section className="border-t border-border pt-4">
        <Form {...closeForm}>
          <form
            onSubmit={closeForm.handleSubmit((data) =>
              closeMutation.mutate(data),
            )}
            className="flex items-end gap-2"
          >
            <FormField
              control={closeForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Closure note</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              size="sm"
              type="submit"
              variant="destructive"
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? "Closing..." : "Close"}
            </Button>
          </form>
        </Form>
      </section>
    </div>
  );
}

function getSendDefaultValues(followUp: FollowUp) {
  const recipient =
    followUp.channel === "email" ? "customer@example.com" : "manual";
  const body = resolveTemplate(
    followUp.notes ?? "Checking in after your service.",
    {
      businessName: "afterservice",
      customerName: followUp.customerName,
      serviceName: followUp.serviceTitle,
    },
  );

  return {
    id: followUp.id,
    recipient,
    subject: "Checking in after your service",
    body,
  };
}
