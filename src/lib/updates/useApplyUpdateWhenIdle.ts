import { useEffect } from "react";
import { applyPendingUpdate } from "./index";

/**
 * Mounted by the cover screen. Returning to the cover means the last guest has
 * finished, so a build that arrived mid-session is taken now instead.
 */
export function useApplyUpdateWhenIdle(delayMs = 4000) {
  useEffect(() => {
    const timer = setTimeout(applyPendingUpdate, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);
}
