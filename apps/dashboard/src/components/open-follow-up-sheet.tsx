"use client";

import { Button } from "@anodizex/ui/button";
import { Icons } from "@anodizex/ui/icons";
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
