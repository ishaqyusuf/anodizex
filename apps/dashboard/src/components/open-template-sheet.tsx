"use client";

import { Button } from "@anodizex/ui/button";
import { Icons } from "@anodizex/ui/icons";
import { useTemplateParams } from "@/hooks/use-template-params";

export function OpenTemplateSheet() {
  const { setParams } = useTemplateParams();

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setParams({ createTemplate: true })}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
