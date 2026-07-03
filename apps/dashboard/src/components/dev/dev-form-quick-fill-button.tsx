"use client";

if (process.env.NODE_ENV === "production") {
  throw new Error("DevFormQuickFillButton must not be imported in production.");
}

import { Button } from "@anodizex/ui";
import type { QuickFillFormAdapter } from "./quick-fill";

type Props = {
  label?: string;
  onClick: () => void;
};

export function DevFormQuickFillButton({
  label = "Quick fill",
  onClick,
}: Props) {
  return (
    <Button onClick={onClick} size="sm" variant="ghost" type="button">
      {label}
    </Button>
  );
}

export function runQuickFillFromAdapter(
  adapter: QuickFillFormAdapter,
  profile: "auth-sign-up" | "auth-sign-in" | "onboarding-workspace",
  overrides?: Record<string, unknown>,
) {
  const { runQuickFill } = require("./quick-fill");
  runQuickFill(adapter, profile, overrides);
}
