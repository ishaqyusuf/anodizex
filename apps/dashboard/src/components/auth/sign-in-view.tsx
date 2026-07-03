"use client";

import { Button } from "@anodizex/ui";
import { Database, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AuthFooter, AuthShell } from "@/components/auth/auth-shell";
import {
  type SignInFieldValues,
  SignInForm,
} from "@/components/auth/sign-in-form";

const DevLoginFab = dynamic(
  () =>
    import("@/components/dev/dev-login-fab").then((mod) => ({
      default: mod.DevLoginFab,
    })),
  { ssr: false },
);

type SignInValues = SignInFieldValues;
type SignInAdapter = React.MutableRefObject<{
  getValues: () => SignInValues;
  reset: (values: SignInValues) => void;
  setValue: (name: string, value: unknown) => void;
} | null>;

type DbAccountDebug = {
  accounts: Array<{
    accountId: string;
    id: string;
    providerId: string;
    userId: string;
  }>;
  error?: string;
};

type SignInViewProps = {
  dbAccountDebug?: DbAccountDebug;
};

export function SignInView({ dbAccountDebug }: SignInViewProps) {
  const adapterRef = useRef<SignInAdapter["current"]>(null);
  const [accountDebugOpen, setAccountDebugOpen] = useState(false);
  const [returnTo, setReturnTo] = useState("/");

  useEffect(() => {
    setReturnTo(getReturnTo());
  }, []);

  async function handleSignIn(values: SignInValues) {
    const response = await fetch("/api/auth/sign-in/email", {
      body: JSON.stringify({
        callbackURL: returnTo,
        email: values.email,
        password: values.password,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(payload?.message ?? "Sign-in failed.");
    }

    window.location.href = returnTo;
  }

  return (
    <AuthShell
      description="Use your operator account to access the dashboard."
      footer={
        <AuthFooter>
          Don&apos;t have an account? <a href="/sign-up">Sign up</a>
        </AuthFooter>
      }
      title="Sign in"
    >
      <SignInForm
        onSignIn={handleSignIn}
        returnTo={returnTo}
        adapterRef={adapterRef}
      />
      {dbAccountDebug ? (
        <DbAccountDebugFab
          debug={dbAccountDebug}
          open={accountDebugOpen}
          onOpenChange={setAccountDebugOpen}
        />
      ) : null}
      {process.env.NODE_ENV !== "production" && (
        <DevLoginFab
          onFill={(account: { email: string; password: string }) => {
            adapterRef.current?.reset({
              email: account.email,
              password: account.password,
            });
          }}
          onSignIn={(account: { email: string; password: string }) => {
            handleSignIn({
              email: account.email,
              password: account.password,
            }).catch(() => {
              adapterRef.current?.reset({
                email: account.email,
                password: account.password,
              });
            });
          }}
        />
      )}
    </AuthShell>
  );
}

function DbAccountDebugFab({
  debug,
  onOpenChange,
  open,
}: {
  debug: DbAccountDebug;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open ? (
        <div className="mb-2 w-[min(calc(100vw-2rem),28rem)] overflow-hidden rounded-md border border-border bg-background text-left shadow-xl">
          <div className="flex items-center justify-between gap-3 border-border border-b bg-muted/50 px-3 py-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                DB account ids
              </h2>
              <p className="text-xs text-muted-foreground">
                {debug.accounts.length} rows
              </p>
            </div>
            <Button
              aria-label="Close DB account ids"
              onClick={() => onOpenChange(false)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="max-h-80 overflow-auto p-2">
            {debug.error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs leading-5 text-destructive">
                {debug.error}
              </p>
            ) : null}
            {debug.accounts.length > 0 ? (
              <ul className="space-y-2">
                {debug.accounts.map((account) => (
                  <li
                    className="rounded-md border border-border bg-muted/20 p-2 font-mono text-[11px] leading-5 text-foreground"
                    key={account.id}
                  >
                    <div>ID: {account.id}</div>
                    <div>Account: {account.accountId}</div>
                    <div>Provider: {account.providerId}</div>
                    <div>User: {account.userId}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-2 text-xs text-muted-foreground">
                No account rows found.
              </p>
            )}
          </div>
        </div>
      ) : null}
      <Button
        className="shadow-lg"
        onClick={() => onOpenChange(!open)}
        type="button"
        variant="secondary"
      >
        <Database className="size-4" />
        DB accounts
        <span className="rounded bg-background/80 px-1.5 py-0.5 text-[11px]">
          {debug.accounts.length}
        </span>
      </Button>
    </div>
  );
}

function getReturnTo() {
  if (typeof window === "undefined") return "/";
  const returnTo = new URLSearchParams(window.location.search).get("return_to");
  if (!returnTo?.startsWith("/")) return "/";
  if (returnTo.startsWith("//")) return "/";
  return returnTo;
}
