"use client";

import { useEffect } from "react";
import { trackClient } from "./client-track";

// Records one listing_viewed event on mount, from the client, so the page it sits
// on stays statically cached. The beacon hits /api/events, which classifies the
// event's record_class server side (by host and session), so nothing here reads
// request headers or cookies and no ISR is lost.
export default function ViewTracker({ kind }: { kind: string }) {
  useEffect(() => {
    trackClient("listing_viewed", { kind });
  }, [kind]);
  return null;
}
