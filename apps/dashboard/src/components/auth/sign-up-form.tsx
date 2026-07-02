"use client";

import { LogEvents } from "@afterservice/events";
import { useTrack } from "@afterservice/events/client";
import { Button, Icons, Input } from "@afterservice/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@afterservice/ui/form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import type { QuickFillFormAdapter } from "@/components/dev/quick-fill";
import { useZodForm } from "@/hooks/use-zod-form";
import { signIn } from "@/lib/auth-client";

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type FieldValues = {
  name: string;
  email: string;
  password: string;
};

type Props = {
  onSignUp: (values: FieldValues) => Promise<void>;
  adapterRef?: React.MutableRefObject<QuickFillFormAdapter<FieldValues> | null>;
};

export function SignUpForm({ onSignUp, adapterRef }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const track = useTrack();
  const form = useZodForm({
    schema: signUpSchema,
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const isPending = form.formState.isSubmitting;

  if (adapterRef) {
    adapterRef.current = {
      getValues: () => form.getValues(),
      reset: (values) => form.reset(values as FieldValues),
      setValue: (name, value) => {
        if (name === "name" || name === "email" || name === "password") {
          form.setValue(name, String(value), {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      },
    };
  }

  async function handleSubmit(values: FieldValues) {
    setError(null);
    track({
      event: LogEvents.SignUpStarted.name,
      channel: LogEvents.SignUpStarted.channel,
      location: "dashboard_sign_up",
      method: "email",
    });

    try {
      await onSignUp(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed.");
    }
  }

  async function handleGoogleSignUp() {
    setIsGooglePending(true);
    setError(null);
    track({
      event: LogEvents.SignUpStarted.name,
      channel: LogEvents.SignUpStarted.channel,
      location: "dashboard_sign_up",
      method: "google",
    });
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: "/onboarding",
        disableRedirect: true,
        newUserCallbackURL: "/onboarding?signup_method=google",
      });

      if (result.error) {
        console.error("[afterservice-auth-debug] Google sign-up failed", {
          error: result.error,
          location: window.location.href,
        });
        throw new Error(result.error.message ?? "Google sign-up failed.");
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      setIsGooglePending(false);
    } catch (err) {
      console.error("[afterservice-auth-debug] Google sign-up exception", {
        error: err instanceof Error ? err.message : String(err),
        location: window.location.href,
      });
      setError(err instanceof Error ? err.message : "Google sign-up failed.");
      setIsGooglePending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignUp}
          disabled={isGooglePending || isPending}
          className="w-full h-11 relative"
        >
          {isGooglePending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.Google className="mr-2 h-4 w-4" />
          )}
          Sign up with Google
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isPending || isGooglePending}
                    className="h-11"
                    placeholder="John Doe"
                  />
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
                    {...field}
                    type="email"
                    disabled={isPending || isGooglePending}
                    className="h-11"
                    placeholder="name@example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    disabled={isPending || isGooglePending}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            disabled={isPending || isGooglePending}
            type="submit"
            className="h-11 w-full"
          >
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export type { FieldValues as SignUpFieldValues };
