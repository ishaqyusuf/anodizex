"use client";

import { Button } from "@anodizex/ui";
import { type FieldValues, useFormContext } from "react-hook-form";
import {
  parseQuickFillArgs,
  type QuickFillArgs,
  type QuickFillArgsFor,
  type QuickFillName,
} from "@/lib/quick-fill";

type QuickFillProps = {
  [Name in QuickFillName]: {
    args?: QuickFillArgs[Name];
    label?: string;
    name: Name;
  };
}[QuickFillName];

export function QuickFill({
  args,
  label = "Quick fill",
  name,
}: QuickFillProps) {
  const form = useFormContext<FieldValues>();

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  async function handleClick() {
    const { quickFillers } = await import("@/lib/quick-fill");
    const parsedArgs = parseQuickFillArgs({
      name,
      ...(args ?? {}),
    } as unknown as QuickFillArgsFor<typeof name>);
    const quickFill = quickFillers[name] as unknown as (
      targetForm: typeof form,
      args?: QuickFillArgs[typeof name],
    ) => void;
    quickFill(form, parsedArgs as unknown as QuickFillArgs[typeof name]);
  }

  return (
    <Button onClick={handleClick} size="sm" type="button" variant="ghost">
      {label}
    </Button>
  );
}
