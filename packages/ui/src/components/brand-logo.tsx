import { cn } from "../utils";

export function AnodizexMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 414 414"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <image
        href="/brand/anodizex-logo.png"
        width="414"
        height="414"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}

export function BrandLogo({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-foreground leading-none",
        className,
      )}
    >
      <AnodizexMark className="h-8 w-8 shrink-0 rounded-[7px]" />
      <span className="tracking-tight font-bold text-lg">{name}</span>
    </div>
  );
}
