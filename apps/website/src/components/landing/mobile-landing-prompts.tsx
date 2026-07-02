"use client";

import { useState } from "react";
import { MobileInstallTopSheet } from "./mobile-install-top-sheet";
import { MobileJoinBetaSheet } from "./mobile-join-beta-sheet";

export function MobileLandingPrompts() {
  const [installSheetVisible, setInstallSheetVisible] = useState(false);

  return (
    <>
      <MobileInstallTopSheet onVisibilityChange={setInstallSheetVisible} />
      <MobileJoinBetaSheet isSuppressed={installSheetVisible} />
    </>
  );
}
