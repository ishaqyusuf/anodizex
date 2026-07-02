"use client";

import {
  getLocalizedPlanPrice,
  type PricingResolution,
} from "@afterservice/plans";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
} from "@afterservice/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { formatDate } from "@/lib/dashboard-format";
import { useTRPC } from "@/trpc/client";

const planLabels = {
  growth: "Shop",
  pro: "Growth",
  starter: "Starter",
} as const;

const planStatusLabels = {
  active: "Active",
  canceled: "Canceled",
  past_due: "Past due",
  trialing: "Trialing",
} as const;

const billingMetricSkeletons = ["customers", "follow-ups", "templates", "team"];
const billingUsageSkeletons = ["customers", "follow-ups", "templates", "team"];
const billingHistorySkeletons = ["current", "renewal", "trial"];
const paidPlans = [
  { id: "starter", name: "Starter" },
  { id: "shop", name: "Shop" },
  { id: "growth", name: "Growth" },
] as const;

type BillingOverviewProps = {
  initialPricing: PricingResolution;
};

export function BillingOverview({ initialPricing }: BillingOverviewProps) {
  const trpc = useTRPC();
  const pricing = initialPricing;
  const { data, isLoading } = useQuery(
    trpc.billing.getCurrentPlan.queryOptions(),
  );
  const { data: portalData } = useQuery(
    trpc.billing.getPortalUrl.queryOptions(),
  );
  const router = useRouter();

  const checkoutMutation = useMutation(
    trpc.billing.createCheckout.mutationOptions({
      onSuccess: (data) => {
        router.push(data.checkoutUrl);
      },
    }),
  );

  if (isLoading) {
    return <BillingOverviewSkeleton />;
  }

  if (!data?.item) {
    return <BillingOverviewEmptyState onRetry={() => router.refresh()} />;
  }

  const {
    isCheckoutEnabled,
    limits,
    plan,
    planDisplayName,
    planStatus,
    subscription,
    usage,
  } = data.item;
  const planLabel = planLabels[plan] ?? plan;
  const planStatusLabel = planStatusLabels[planStatus] ?? planStatus;
  const usageItems = [
    {
      label: "Customers",
      limit: limits.customers,
      value: usage.customers,
    },
    {
      label: "Follow-ups",
      limit: limits.followUps,
      value: usage.followUps,
    },
    {
      label: "Templates",
      limit: limits.templates,
      value: usage.templates,
    },
    {
      label: "Team members",
      limit: limits.teamMembers,
      value: usage.teamMembers,
    },
  ];

  return (
    <div className="max-w-[900px] space-y-8 py-6">
      <header className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={planStatus === "active" ? "default" : "outline"}
              className="w-fit"
            >
              {planStatusLabel}
            </Badge>
            <Badge variant="outline">{planLabel}</Badge>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
            <p className="text-muted-foreground">
              You are on {planDisplayName}. Free beta keeps the core board open
              while paid plans are shaped around real operator usage.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {portalData?.portalUrl ? (
            <Button asChild variant="outline">
              <a href={portalData.portalUrl}>
                Portal
                <ArrowUpRight className="ml-2 size-4" />
              </a>
            </Button>
          ) : null}
          <Button
            onClick={() => checkoutMutation.mutate()}
            disabled={!isCheckoutEnabled || checkoutMutation.isPending}
          >
            <CreditCard className="mr-2 size-4" />
            {isCheckoutEnabled
              ? checkoutMutation.isPending
                ? "Starting..."
                : "Start checkout"
              : "Paid plans coming after beta"}
          </Button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <PlanMetric
          label="Plan"
          value={planDisplayName}
          detail={planStatusLabel}
        />
        {usageItems.slice(0, 3).map((item) => (
          <PlanMetric
            key={item.label}
            label={item.label}
            value={`${item.value}/${item.limit}`}
            detail={`${usagePercent(item.value, item.limit)}% used`}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader className="border-b pb-5">
            <CardTitle className="mb-1 text-base">Usage</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current workspace usage against plan limits.
            </p>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {usageItems.map((item) => (
              <UsageRow key={item.label} {...item} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-5">
            <CardTitle className="mb-1 text-base">Subscription</CardTitle>
            <p className="text-sm text-muted-foreground">
              Provider state and renewal details.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <dl className="divide-y divide-border">
              <BillingRow label="Provider subscription">
                {subscription?.providerSubId ??
                  "Free beta, no provider subscription"}
              </BillingRow>
              <BillingRow label="Current period end">
                {formatDate(subscription?.currentPeriodEnd)}
              </BillingRow>
              <BillingRow label="Webhook status">
                {subscription
                  ? "Last provider event synced"
                  : "Paid billing is not active for this workspace"}
              </BillingRow>
            </dl>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="border-b pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="mb-1 text-base">
                Planned paid pricing
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Preview paid-plan prices in the regional currency resolved from
                the current location and locale.
              </p>
            </div>
          </div>
          {pricing.note ? (
            <p className="mt-3 text-xs text-muted-foreground">{pricing.note}</p>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
          {paidPlans.map((paidPlan) => {
            const price = getLocalizedPlanPrice(paidPlan.id, pricing);

            return (
              <div
                key={paidPlan.id}
                className="rounded-md border border-border bg-muted/20 p-4"
              >
                <p className="text-sm font-medium">{paidPlan.name}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {price.formattedMonthly}
                </p>
                <p className="text-xs text-muted-foreground">
                  per month planned
                </p>
                {price.formattedYearly ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {price.formattedYearly}/year planned
                  </p>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-lg font-medium">Beta billing note</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          No credit card is required during beta. When paid plans launch, beta
          users will receive founder-rate pricing and can manage subscription
          details from the billing portal.
        </p>
      </section>
    </div>
  );
}

export function BillingOverviewSkeleton() {
  return (
    <div className="max-w-[900px] space-y-8 py-6">
      <header className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-full max-w-[560px]" />
            <Skeleton className="h-5 w-3/4 max-w-[440px]" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {billingMetricSkeletons.map((item) => (
          <Card key={item}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader className="border-b pb-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {billingUsageSkeletons.map((item) => (
              <div key={item} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {billingHistorySkeletons.map((item) => (
              <div key={item} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function BillingOverviewEmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-[900px] space-y-8 py-6">
      <header className="border-b border-border pb-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Billing details are not available for this workspace yet.
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium">No billing profile found</p>
            <p className="max-w-xl text-sm text-muted-foreground">
              Refresh the workspace billing state to load plan, usage, and
              subscription details.
            </p>
          </div>
          <Button variant="outline" onClick={onRetry}>
            Refresh billing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanMetric({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-3 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function UsageRow({
  label,
  limit,
  value,
}: {
  label: string;
  limit: number;
  value: number;
}) {
  const percent = usagePercent(value, limit);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value}/{limit}
        </span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  );
}

function BillingRow({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 sm:p-6">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

function usagePercent(value: number, limit: number) {
  if (limit <= 0) return 0;

  return Math.min(100, Math.round((value / limit) * 100));
}
