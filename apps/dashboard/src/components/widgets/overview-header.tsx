"use client";

import { Badge, Button } from "@afterservice/ui";
import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import type { DashboardOverviewData } from "./overview-types";

export function OverviewHeader({ data }: { data: DashboardOverviewData }) {
  const { workspace } = data;
  const serviceLabel =
    workspace?.serviceCategory ?? workspace?.businessType ?? "Local service";
  const workspaceName = workspace?.name ?? "Dashboard";

  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
            Workspace live
          </Badge>
          <Badge variant="outline">{serviceLabel}</Badge>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {workspaceName}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            A focused operating view for completed jobs, customer check-ins,
            overdue follow-ups, and the next work that keeps after-service
            moving.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/jobs">
            <Plus className="mr-2 size-4" />
            Log job
          </Link>
        </Button>
        <Button asChild>
          <Link href="/follow-ups">
            <ClipboardList className="mr-2 size-4" />
            Work board
          </Link>
        </Button>
      </div>
    </header>
  );
}
