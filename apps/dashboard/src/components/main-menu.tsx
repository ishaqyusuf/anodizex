"use client";

import { dashboardNavItems } from "@afterservice/site-nav";
import { Icons } from "@afterservice/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

type NavIcon = ComponentType<{ className?: string }>;

const navIcons: Record<string, NavIcon> = {
  "/": Icons.Overview,
  "/customers": Icons.Customers,
  "/jobs": Icons.Transactions,
  "/follow-ups": Icons.Notifications,
  "/templates": Icons.Description,
  "/billing": Icons.Currency,
  "/settings": Icons.Settings,
};

export function MainMenu({
  isExpanded,
  onSelect,
}: {
  isExpanded: boolean;
  onSelect?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard navigation" className="flex flex-col gap-2 px-3 py-4">
      {dashboardNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = navIcons[item.href];

        return (
          <Link
            href={item.href}
            key={item.href}
            onClick={onSelect}
            className={`flex items-center gap-3 h-10 rounded-md transition-colors relative overflow-hidden ${
              isExpanded ? "justify-start px-3" : "justify-center px-0 w-10 mx-auto"
            } ${
              isActive
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium"
            }`}
            title={!isExpanded ? item.label : undefined}
          >
            {Icon && <Icon className="size-5 shrink-0" />}
            {isExpanded && (
              <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
