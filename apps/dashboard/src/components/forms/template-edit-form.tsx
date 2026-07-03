"use client";

import type { AppRouter } from "@anodizex/api/router";
import { updateTemplateSchema } from "@anodizex/api/schemas";
import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@anodizex/ui";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@anodizex/ui/form";
import { useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { useEffect } from "react";
import { useDashboardInvalidations } from "@/hooks/use-dashboard-invalidations";
import {
  templateChannelLabels,
  templateChannels,
} from "@/hooks/use-template-filter-params";
import { useTemplateParams } from "@/hooks/use-template-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

type Template = inferRouterOutputs<AppRouter>["templates"]["get"]["item"];

type Props = {
  template: Template;
};

const channelOptions = templateChannels.map((channel) => ({
  label: templateChannelLabels[channel],
  value: channel,
}));

export function TemplateEditForm({ template }: Props) {
  const trpc = useTRPC();
  const { setParams } = useTemplateParams();
  const invalidate = useDashboardInvalidations();

  const handleSuccess = () => {
    invalidate.templates(template.id);
    setParams(null);
  };

  const updateMutation = useMutation(
    trpc.templates.update.mutationOptions({
      onSuccess: handleSuccess,
    }),
  );
  const archiveMutation = useMutation(
    trpc.templates.archive.mutationOptions({
      onSuccess: handleSuccess,
    }),
  );

  const form = useZodForm({
    schema: updateTemplateSchema,
    defaultValues: {
      id: template.id,
      name: template.name,
      channel: template.channel as "email" | "sms" | "phone" | "whatsapp",
      subject: template.subject ?? "",
      body: template.body,
      isDefault: template.isDefault,
    },
  });

  useEffect(() => {
    form.reset({
      id: template.id,
      name: template.name,
      channel: template.channel as "email" | "sms" | "phone" | "whatsapp",
      subject: template.subject ?? "",
      body: template.body,
      isDefault: template.isDefault,
    });
  }, [template, form]);

  return (
    <div className="mt-6 space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Body</FormLabel>
                <FormControl>
                  <Textarea className="h-32" {...field} />
                </FormControl>
                <FormDescription>
                  Use variables like {"{{customer_name}}"} and{" "}
                  {"{{service_name}}"}.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Set as default</FormLabel>
                  <FormDescription>
                    Use this template first for its channel.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          archiveMutation.mutate({ id: template.id });
        }}
        className="border-t border-border pt-4"
      >
        <Button
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={archiveMutation.isPending}
        >
          {archiveMutation.isPending ? "Archiving..." : "Archive template"}
        </Button>
      </form>
    </div>
  );
}
