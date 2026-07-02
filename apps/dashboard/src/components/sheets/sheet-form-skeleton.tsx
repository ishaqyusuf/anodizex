"use client";

import { Skeleton } from "@afterservice/ui";

type SheetFormSkeletonProps = {
  fields?: number;
  footer?: boolean;
};

export function SheetFormSkeleton({
  fields = 5,
  footer = true,
}: SheetFormSkeletonProps) {
  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      {footer ? <Skeleton className="h-9 w-full" /> : null}
    </div>
  );
}
