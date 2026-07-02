"use client";

import type { ReactNode } from "react";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@afterservice/ui";
import { cn } from "@afterservice/ui/cn";

type DashboardSheetContentProps = {
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title: string;
};

export function DashboardSheetContent({
  bodyClassName = "pt-6",
  children,
  className,
  description,
  title,
}: DashboardSheetContentProps) {
  return (
    <SheetContent className={cn("overflow-y-auto", className)} title={title}>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        {description ? (
          <SheetDescription>{description}</SheetDescription>
        ) : null}
      </SheetHeader>
      <div className={bodyClassName}>{children}</div>
    </SheetContent>
  );
}
