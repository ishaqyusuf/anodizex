"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afterservice/ui";
import { ThemeSwitch } from "@/components/theme-switch";

export function ChangeTheme() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how afterservice looks on this device.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="w-[240px]">
          <ThemeSwitch />
        </div>
      </CardContent>
    </Card>
  );
}
