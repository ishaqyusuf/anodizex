import { SentryExampleButton } from "./sentry-example-button";

export default function SentryExamplePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="font-semibold text-xl">Sentry example page</h1>
          <p className="text-muted-foreground text-sm">
            Trigger a captured client error for afterservice dashboard.
          </p>
        </div>
        <SentryExampleButton />
      </div>
    </main>
  );
}
