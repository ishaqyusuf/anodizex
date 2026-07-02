"use client";

import { Button, Input } from "@afterservice/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@afterservice/ui/form";
import { useState } from "react";
import { z } from "zod";
import { useZodForm } from "@/hooks/use-zod-form";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const form = useZodForm({
    schema: resetPasswordSchema,
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function handleSubmit(data: z.infer<typeof resetPasswordSchema>) {
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: data.password }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message || "Failed to reset password.");
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password.",
      );
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-green-500/10 p-4">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Your password has been successfully reset.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = "/sign-in";
          }}
        >
          Return to log in
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  disabled={form.formState.isSubmitting}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  disabled={form.formState.isSubmitting}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="h-11 w-full"
        >
          {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    </Form>
  );
}
