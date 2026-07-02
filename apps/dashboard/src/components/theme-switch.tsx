"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@afterservice/ui";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Theme = "dark" | "system" | "light";

function ThemeIcon({ theme }: { theme?: Theme }) {
  switch (theme) {
    case "dark":
      return <Moon size={12} />;
    case "system":
      return <Monitor size={12} />;
    default:
      return <Sun size={12} />;
  }
}

export function ThemeSwitch() {
  const { theme, setTheme, themes, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-6 w-[96px]" />;
  }

  return (
    <div className="relative flex items-center">
      <Select value={theme} onValueChange={(value) => setTheme(value)}>
        <SelectTrigger className="h-6 w-[104px] border-0 bg-transparent py-0.5 pl-6 pr-3 text-xs capitalize shadow-none">
          <SelectValue>
            {theme
              ? theme.charAt(0).toUpperCase() + theme.slice(1)
              : "Theme"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themes.map((item) => (
              <SelectItem
                key={item}
                value={item}
                className="text-xs capitalize"
              >
                {item}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="pointer-events-none absolute left-2">
        <ThemeIcon theme={resolvedTheme as Theme} />
      </div>
    </div>
  );
}
