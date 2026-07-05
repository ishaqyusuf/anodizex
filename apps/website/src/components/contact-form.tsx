"use client";

import { contactInquirySchema } from "@anodizex/api/schemas";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Input,
  Textarea,
} from "@anodizex/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@anodizex/ui/form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { z } from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

type ContactFormValues = z.output<typeof contactInquirySchema>;

export function ContactForm() {
  const trpc = useTRPC();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const submitContact = useMutation(
    trpc.website.submitContact.mutationOptions(),
  );
  const form = useZodForm({
    schema: contactInquirySchema,
    defaultValues: {
      companyName: "",
      email: "",
      message: "",
      name: "",
      phone: "",
      projectType: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setStatus("idle");
    setMessage("");

    try {
      await submitContact.mutateAsync(values);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not submit the enquiry.",
      );
      return;
    }

    form.reset();
    setStatus("success");
    setMessage(
      "Your enquiry was sent. We also sent a confirmation email to the address you provided.",
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {status !== "idle" && (
        <Alert variant={status === "error" ? "destructive" : "default"}>
          <AlertTitle>
            {status === "error" ? "Message not sent" : "Message sent"}
          </AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+234..." {...field} />
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
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project type</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Windows, sliding doors, facade, entrance..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-32"
                    placeholder="Tell us about the opening sizes, location, project stage, and timeline."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" disabled={submitContact.isPending}>
            {submitContact.isPending ? "Sending..." : "Send enquiry"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
