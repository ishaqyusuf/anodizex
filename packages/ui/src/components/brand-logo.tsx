import { cn } from "../utils";

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
      <svg
        aria-hidden="true"
        className="h-8 w-8 shrink-0"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 51V29C50 18.5 41.5 10 31 10S12 18.5 12 29s8.5 19 19 19c5.1 0 9.8-2 13.2-5.3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="13"
        />
        <circle cx="31" cy="29" r="6.5" className="fill-[#009b98]" />
      </svg>
      <span className="tracking-tight font-bold text-lg">{name}</span>
    </div>
  );
}
