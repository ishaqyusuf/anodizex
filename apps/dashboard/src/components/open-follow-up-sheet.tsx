"use client";

import { Button } from "@afterservice/ui/button";
import { Icons } from "@afterservice/ui/icons";
import { useFollowUpParams } from "@/hooks/use-follow-up-params";

export function OpenFollowUpSheet() {
  const { setParams } = useFollowUpParams();

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setParams({ createFollowUp: true })}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
