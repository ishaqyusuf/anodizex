"use client";

import type { AppRouter } from "@anodizex/api/router";
import { updateCustomerSchema } from "@anodizex/api/schemas";
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
import type { inferRouterOutputs } from "@trpc/server";
import { useEffect } from "react";
import { CustomerTagsInput } from "@/components/forms/customer-tags-input";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useDashboardInvalidations } from "@/hooks/use-dashboard-invalidations";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

type Customer = inferRouterOutputs<AppRouter>["customers"]["get"]["item"];

type Props = {
  customer: Customer;
};

export function CustomerEditForm({ customer }: Props) {
  const trpc = useTRPC();
  const { setParams } = useCustomerParams();
  const invalidate = useDashboardInvalidations();

  const handleSuccess = () => {
    invalidate.customers(customer.id);
    setParams(null);
  };

  const updateCustomer = useMutation(
    trpc.customers.update.mutationOptions({
      onSuccess: handleSuccess,
    }),
  );

  const archiveCustomer = useMutation(
    trpc.customers.archive.mutationOptions({
      onSuccess: handleSuccess,
    }),
  );

  const form = useZodForm({
    schema: updateCustomerSchema,
    defaultValues: {
      id: customer.id,
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      companyName: customer.companyName ?? "",
      tags: customer.tags.join(", "),
      notes: customer.notes ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      id: customer.id,
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      companyName: customer.companyName ?? "",
      tags: customer.tags.join(", "),
      notes: customer.notes ?? "",
    });
  }, [customer, form]);

  return (
    <div className="mt-6 space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => updateCustomer.mutate(data))}
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
                    disabled={updateCustomer.isPending}
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
                  <Textarea className="h-32" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={updateCustomer.isPending}
            className="w-full"
          >
            {updateCustomer.isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Form>

      <div className="border-t border-border pt-4">
        <Button
          variant="destructive"
          className="w-full"
          disabled={archiveCustomer.isPending}
          onClick={() => archiveCustomer.mutate({ id: customer.id })}
        >
          {archiveCustomer.isPending ? "Archiving..." : "Archive customer"}
        </Button>
      </div>
    </div>
  );
}
