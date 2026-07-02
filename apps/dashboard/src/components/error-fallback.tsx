"use client";

import { Button, Card, CardContent } from "@afterservice/ui";
import { useRouter } from "next/navigation";

export function ErrorFallback() {
  const router = useRouter();

  return (
    <div className="flex min-h-[320px] items-center justify-center py-6">
      <Card className="w-full max-w-xl">
        <CardContent className="flex flex-col items-start gap-4 p-6">
          <div className="space-y-1">
            <h2 className="text-base font-medium">Something went wrong</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              The dashboard could not load this workspace view. Refresh the
              page to try the request again.
            </p>
          </div>
          <Button onClick={() => router.refresh()} variant="outline">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
