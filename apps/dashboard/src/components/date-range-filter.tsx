"use client";

import { Button, Calendar } from "@afterservice/ui";
import { formatISO, parseISO } from "date-fns";

type DateRangeFilterProps = {
  start: string | null | undefined;
  end: string | null | undefined;
  onSelect: (range: { start: string | null; end: string | null }) => void;
};

export function DateRangeFilter({
  start,
  end,
  onSelect,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-col">
      <Calendar
        mode="range"
        initialFocus
        numberOfMonths={2}
        selected={{
          from: start ? parseISO(start) : undefined,
          to: end ? parseISO(end) : undefined,
        }}
        onSelect={(range) => {
          onSelect({
            start: range?.from
              ? formatISO(range.from, { representation: "date" })
              : null,
            end: range?.to
              ? formatISO(range.to, { representation: "date" })
              : null,
          });
        }}
      />

      {(start || end) && (
        <div className="border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-full justify-start px-2 text-xs font-normal text-muted-foreground"
            onClick={() => onSelect({ start: null, end: null })}
          >
            Clear date range
          </Button>
        </div>
      )}
    </div>
  );
}
