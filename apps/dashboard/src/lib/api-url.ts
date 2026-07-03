"use client";

import { buildApiUrl } from "@anodizex/utils";

export function getApiBaseUrl() {
  if (typeof window === "undefined") return "";
  return buildApiUrl({ currentUrl: window.location.origin });
}
