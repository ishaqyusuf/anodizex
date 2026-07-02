"use client";

import { useEffect } from "react";

function canRegisterServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  const { hostname, protocol } = window.location;

  return (
    protocol === "https:" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (!canRegisterServiceWorker()) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation remains optional; a failed service worker must not block the site.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
