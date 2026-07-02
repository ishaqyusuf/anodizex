"use client";

import { Button } from "@afterservice/ui/button";
import { Checkbox } from "@afterservice/ui/checkbox";
import { Icons } from "@afterservice/ui/icons";
import { Label } from "@afterservice/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@afterservice/ui/popover";
import { useFollowUpsStore } from "@/store/follow-ups";

export function FollowUpsColumnVisibility() {
  const { columns } = useFollowUpsStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Tune size={18} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0" align="end" sideOffset={8}>
        <div className="flex flex-col p-4 space-y-2 max-h-[400px] overflow-auto">
          {columns
            .filter(
              (column) =>
                column.columnDef.enableHiding !== false &&
                column.id !== "actions",
            )
            .map((column) => {
              const meta = column.columnDef.meta as
                | { headerLabel?: string }
                | undefined;
              const label =
                meta?.headerLabel ??
                column.columnDef.header?.toString() ??
                column.id;

              return (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) =>
                      column.toggleVisibility(checked === true)
                    }
                  />
                  <Label
                    htmlFor={column.id}
                    className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </Label>
                </div>
              );
            })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
