"use client";

import { BrandLogo, Icons } from "@anodizex/ui";
import Link from "next/link";
import { useRef, useState } from "react";
import { MainMenu } from "./main-menu";
import { UserMenu } from "./user-menu";

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const mouseOverRef = useRef(false);

  const handleMouseEnter = () => {
    mouseOverRef.current = true;
    if (!isDropdownOpen) setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    mouseOverRef.current = false;
    if (!isDropdownOpen) setIsExpanded(false);
  };

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (!open) {
      setIsExpanded(mouseOverRef.current);
    }
  };

  return (
    <aside
      className={`h-screen flex-shrink-0 flex-col justify-between fixed top-0 pb-4 items-center hidden md:flex z-50 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] bg-background border-r border-border ${
        isExpanded ? "w-[240px]" : "w-[70px]"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`absolute top-0 left-0 h-[70px] flex items-center bg-background border-b border-border transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isExpanded ? "w-full justify-start pl-6" : "w-[69px] justify-center"
        }`}
      >
        <Link href="/" className="transition-none flex items-center">
          {isExpanded ? (
            <BrandLogo name="afterservice" />
          ) : (
            <Icons.LogoSmall />
          )}
        </Link>
      </div>

      <div className="flex flex-col w-full pt-[70px] flex-1 mb-3">
        <MainMenu isExpanded={isExpanded} />
      </div>

      <div className="flex w-full mt-auto mb-2 px-2">
        <UserMenu isExpanded={isExpanded} onOpenChange={handleDropdownOpenChange} />
      </div>
    </aside>
  );
}
