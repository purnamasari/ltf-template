import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useFlow } from "../flow";

/** How long a guest may stop writing before we ask whether they are still there. */
const IDLE_MS = 5 * 60 * 1000;

/** How long the question stays up before the kiosk clears itself for the next guest. */
const RESET_MS = 30 * 1000;

/** How often the countdown bar is refreshed while the question is up. */
const TICK_MS = 100;

type IdleReset = {
  /** True once the guest has been idle long enough to be asked. */
  asking: boolean;
  /** 0 → 1 as the reset approaches; drives the bar across the foot of the card. */
  elapsed: number;
  /** Any sign of life: dismisses the question and starts the wait again. */
  keepGoing: () => void;
};

/**
 * A kiosk cannot rely on anyone finishing. After five minutes without a
 * touch the flow asks whether the guest is still there, and half a minute
 * later it wipes the draft and returns to the cover for the next person.
 *
 * The screen only renders the question — when it appears, what it counts down
 * to and where the guest ends up are all decided here.
 */
export function useIdleReset(): IdleReset {
  const navigate = useNavigate();
  const { reset } = useFlow();
  const [asking, setAsking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const idleTimer = useRef<number | undefined>(undefined);

  const keepGoing = useCallback(() => {
    setAsking(false);
    setElapsed(0);
  }, []);

  // Restart the idle clock on any sign of life, but only while the question is
  // down — once it is up, dismissing it is the screen's business, so that a
  // stray scroll cannot silently cancel the countdown.
  useEffect(() => {
    if (asking) return;

    const arm = () => {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setAsking(true), IDLE_MS);
    };

    const events = ["pointerdown", "keydown", "wheel"] as const;
    for (const event of events) window.addEventListener(event, arm, { passive: true });
    arm();

    return () => {
      window.clearTimeout(idleTimer.current);
      for (const event of events) window.removeEventListener(event, arm);
    };
  }, [asking]);

  // With the question up, run the countdown and clear the kiosk at the end.
  useEffect(() => {
    if (!asking) return;

    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      const done = Math.min((Date.now() - startedAt) / RESET_MS, 1);
      setElapsed(done);
      if (done < 1) return;

      window.clearInterval(tick);
      reset();
      navigate({ to: "/" });
    }, TICK_MS);

    return () => window.clearInterval(tick);
  }, [asking, reset, navigate]);

  return { asking, elapsed, keepGoing };
}
