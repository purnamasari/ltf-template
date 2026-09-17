import { useEffect } from "react";
import { flush, prune, queued } from "./index";

/**
 * Drains the outbox while the app is open.
 *
 * There is no background here to rely on: Background Sync is Chromium-only and
 * a service worker does not run while a home-screen app is closed. A kiosk is
 * open all day, so a foreground timer is not a downgrade — it is the right fit.
 *
 * `online` fires when the interface comes up, which on hotel wifi is well
 * before anything routes, so it is given a moment to settle.
 */
const SETTLE_MS = 3_000;
const TICK_MS = 60_000;

export function useOutboxSync() {
  useEffect(() => {
    let timer: number | undefined;

    const run = () => {
      void flush();
    };

    const settleThenRun = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, SETTLE_MS);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };

    void prune();
    run();

    const tick = window.setInterval(() => {
      void queued().then((letters) => {
        if (letters.length) run();
      });
    }, TICK_MS);

    window.addEventListener("online", settleThenRun);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(tick);
      window.removeEventListener("online", settleThenRun);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
