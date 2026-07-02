"use client";

import { LogEvents } from "@afterservice/events";
import { useClearIdentity, useTrack } from "@afterservice/events/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@afterservice/ui";
import { LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { ThemeSwitch } from "./theme-switch";

export function UserMenu({
  isExpanded,
  onOpenChange,
}: {
  isExpanded: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const clearIdentity = useClearIdentity();
  const track = useTrack();

  const handleSignOut = async () => {
    setIsPending(true);
    try {
      track({
        event: LogEvents.SignOut.name,
        channel: LogEvents.SignOut.channel,
      });
      const result = await signOut();
      if (result.error) {
        throw new Error(result.error.message ?? "Sign out failed.");
      }

      clearIdentity();
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex w-full px-4 py-3 items-center hover:bg-accent hover:text-accent-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isExpanded ? "justify-start" : "justify-center"
          }`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              U
            </AvatarFallback>
          </Avatar>
          {isExpanded && (
            <div className="ml-3 flex flex-col items-start overflow-hidden">
              <span className="text-sm font-medium leading-none">Workspace</span>
              <span className="text-xs text-muted-foreground mt-1 truncate max-w-full">
                user@example.com
              </span>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isExpanded ? "end" : "center"}
        side="right"
        className="w-56"
        sideOffset={16}
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex flex-row items-center justify-between px-2 py-1.5">
          <p className="text-xs">Theme</p>
          <ThemeSwitch />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isPending}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isPending ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
