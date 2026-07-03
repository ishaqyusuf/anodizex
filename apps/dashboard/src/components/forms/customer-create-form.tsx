"use client";

import { createCustomerSchema } from "@anodizex/api/schemas";
import { Button, Input, Textarea } from "@anodizex/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@anodizex/ui/form";
import { useMutation } from "@tanstack/react-query";
import { CustomerTagsInput } from "@/components/forms/customer-tags-input";
import { QuickFill } from "@/components/quick-fill";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useDashboardInvalidations } from "@/hooks/use-dashboard-invalidations";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

export function CustomerCreateForm() {
  const trpc = useTRPC();
  const invalidate = useDashboardInvalidations();
  const { setParams } = useCustomerParams();

  const form = useZodForm({
    schema: createCustomerSchema,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      companyName: "",
      tags: "",
      notes: "",
    },
  });

  const createCustomerMutation = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: () => {
        invalidate.customers();
        form.reset();
        setParams({ createCustomer: null });
      },
    }),
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          createCustomerMutation.mutate(data),
        )}
        className="space-y-6"
      >
        <div className="flex justify-end">
          <QuickFill name="customer" />
        </div>
        <div className="space-y-4">
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
            name="phone"
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
          <FormField
            control={form.control}
            name="email"
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
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company (optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (optional)</FormLabel>
                <FormControl>
                  <CustomerTagsInput
                    disabled={createCustomerMutation.isPending}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
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
          disabled={createCustomerMutation.isPending}
          className="w-full"
        >
          {createCustomerMutation.isPending ? "Creating..." : "Create customer"}
        </Button>
      </form>
    </Form>
  );
}
