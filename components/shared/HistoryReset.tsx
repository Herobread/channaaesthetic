"use client";

import { useEffect } from "react";

export default function HistoryReset() {
  useEffect(() => {
    // 1. Wipe the forward/back link to Stripe by replacing the active history entry
    window.history.replaceState(null, "", window.location.href);

    // 2. Push homepage behind this entry so "Back" goes straight to "/"
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.location.replace("/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return null;
}
