"use client";

export function SentryExampleButton() {
  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 font-medium text-primary-foreground text-sm"
      type="button"
      onClick={() => {
        throw new Error("Sentry example error from afterservice dashboard");
      }}
    >
      Throw test error
    </button>
  );
}
