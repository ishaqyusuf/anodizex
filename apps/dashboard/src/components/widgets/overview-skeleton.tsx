export function OverviewSkeleton() {
  const skeletonCards = ["due", "overdue", "open", "jobs", "customers", "sent"];

  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse border-b bg-muted/40" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {skeletonCards.map((key) => (
          <div
            className="h-[116px] animate-pulse border bg-muted/40"
            key={key}
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse border bg-muted/40" />
        <div className="h-72 animate-pulse border bg-muted/40" />
      </div>
    </div>
  );
}
