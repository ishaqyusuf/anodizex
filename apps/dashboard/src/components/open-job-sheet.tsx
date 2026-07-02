"use client";

import { Button } from "@afterservice/ui/button";
import { Icons } from "@afterservice/ui/icons";
import { useJobParams } from "@/hooks/use-job-params";

export function OpenJobSheet() {
  const { setParams } = useJobParams();

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setParams({ createJob: true })}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
