"use client";

import {
  Button,
  Input,
  Icons
} from "@afterservice/ui";
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
import { useZodForm } from "@/hooks/use-zod-form";
import { signIn } from "@/lib/auth-client";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type FieldValues = z.infer<typeof signInSchema>;

type Props = {
  onSignIn: (values: FieldValues) => Promise<void>;
  returnTo?: string | null;
  adapterRef?: React.MutableRefObject<QuickFillFormAdapter<FieldValues> | null>;
};

// inline to avoid extra file
type QuickFillFormAdapter<TValues extends Record<string, unknown>> = {
  getValues: () => TValues;
  reset: (values: TValues) => void;
  setValue: (name: string, value: unknown) => void;
};

export function SignInForm({ onSignIn, returnTo, adapterRef }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const form = useZodForm({
    schema: signInSchema,
    defaultValues: {
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
        if (name === "email" || name === "password") {
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

    try {
      await onSignIn(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    }
  }

  async function handleGoogleSignIn() {
    setIsGooglePending(true);
    setError(null);
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: returnTo || "/",
        disableRedirect: true,
      });

      if (result.error) {
        console.error("[afterservice-auth-debug] Google sign-in failed", {
          error: result.error,
          location: window.location.href,
        });
        throw new Error(result.error.message ?? "Google sign-in failed.");
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      setIsGooglePending(false);
    } catch (err) {
      console.error("[afterservice-auth-debug] Google sign-in exception", {
        error: err instanceof Error ? err.message : String(err),
        location: window.location.href,
      });
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setIsGooglePending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGoogleSignIn}
          disabled={isGooglePending || isPending}
          className="w-full h-11 relative"
        >
          {isGooglePending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.Google className="mr-2 h-4 w-4" />
          )}
          Continue with Google
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
          {returnTo && returnTo !== "/" ? (
            <p className="text-center text-sm text-muted-foreground">
              You&apos;ll be redirected to <strong>{returnTo}</strong> after
              sign-in.
            </p>
          ) : null}

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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <a
                    href="/forgot-password"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
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
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export type { FieldValues as SignInFieldValues };
