// NOT FROM FIGMA — a staff screen; see docs/design/frames.md
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Backdrop } from "../components/Backdrop";
import { LogoMark } from "../components/chrome";
import { KIOSK_LABEL } from "../lib/config";
import { pollPairing, startPairing } from "../lib/pairing";
import type { PairingStart } from "../lib/pairing";

/** The code and its claim token expire together, two minutes after issue. */
const WINDOW_SECONDS = 120;
const POLL_MS = 3_000;

/**
 * Pairing the tablet. Staff-facing, and deliberately plain: the design file has
 * no frame for it, and inventing house styling for a screen no guest sees would
 * be a liberty. It is step one of the dashboard's own flow — staff are sent here
 * before they can approve anything.
 */
export function Pair() {
  const navigate = useNavigate();
  const [pairing, setPairing] = useState<PairingStart | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * The deadline is held as a timestamp and the clock ticks separately, so the
   * poll below depends on when the code expires rather than on the second hand.
   * Keying the poll to the countdown tears its interval down every second, and
   * a 3s poll inside a 1s teardown never fires at all.
   */
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  const request = useCallback(async () => {
    try {
      const started = await startPairing(KIOSK_LABEL);
      setPairing(started);
      setExpiresAt(Date.now() + WINDOW_SECONDS * 1000);
      setNow(Date.now());
      setError(null);
    } catch {
      setPairing(null);
      setError("Could not reach the server. Check the tablet's connection and try again.");
    }
  }, []);

  useEffect(() => {
    // Asking the server for a code is the external synchronisation an effect is
    // for, and the state is set after the await rather than during the render.
    // eslint-disable-next-line react/set-state-in-effect
    void request();
  }, [request]);

  useEffect(() => {
    if (!pairing) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [pairing]);

  useEffect(() => {
    if (!pairing || !expiresAt) return;

    const poll = window.setInterval(() => {
      if (Date.now() >= expiresAt) return;

      void pollPairing(pairing.claim_token).then((state) => {
        if (state === "paired") navigate({ to: "/" });
        // Expired, already claimed, or unknown: the countdown covers it, and
        // "Show a new code" starts again at step one.
        if (state === "expired") setExpiresAt(Date.now());
      });
    }, POLL_MS);

    return () => window.clearInterval(poll);
  }, [pairing, expiresAt, navigate]);

  const expired = remaining <= 0;
  const [first, ...rest] = pairing?.device_code.split("-") ?? [];

  return (
    <>
      <Backdrop />
      <LogoMark className="left-[52px] top-[58px]" />

      <div className="absolute inset-0 grid place-content-center text-center">
        <h1 className="font-display text-[40px] font-light text-ink">Pair this tablet</h1>
        <p className="mt-[12px] text-[20px] text-ink-soft">
          Enter this code in the dashboard to finish setting the kiosk up.
        </p>

        {pairing && !expired && (
          <>
            <p className="mt-[40px] font-mono text-[64px] tracking-[0.08em] text-ink">
              {first}
              {rest.length > 0 && <span className="px-[16px] text-ink-muted">·</span>}
              {rest.join(" ")}
            </p>
            <p className="mt-[12px] text-[18px] text-ink-muted">
              Expires in {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </p>
          </>
        )}

        {expired && (
          <p className="mt-[40px] text-[22px] text-ink-soft">
            That code has expired. Codes often run out while somebody fetches a
            dashboard login — ask for a new one.
          </p>
        )}

        {error && <p className="mt-[40px] text-[22px] text-brick">{error}</p>}

        <button
          type="button"
          onClick={() => void request()}
          className="mx-auto mt-[48px] h-[64px] w-[280px] rounded-full bg-forest text-[20px] text-on-forest"
        >
          Show a new code
        </button>
      </div>
    </>
  );
}
