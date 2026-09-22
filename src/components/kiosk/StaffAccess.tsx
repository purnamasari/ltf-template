// NOT FROM FIGMA — a staff control; see docs/design/frames.md
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { STAFF_PASSCODE } from "../../lib/config";

/** Five presses inside two seconds. Brisk enough that nobody finds it by accident. */
const PRESSES = 5;
const WINDOW_MS = 2_000;

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

type StaffAccessValue = { press: () => void };

const StaffAccessContext = createContext<StaffAccessValue | null>(null);

/**
 * The way staff get to the pairing screen.
 *
 * A kiosk cannot show a settings button to the room, so pairing sits behind the
 * Raffles mark **on the cover** — the screen the kiosk sits on between guests.
 * Five presses in two seconds and a passcode is asked for. Deliberately not the
 * mark on the flow screens: a guest part-way through a postcard should not be
 * able to fall into it, and staff always have the cover to hand.
 */
export function StaffAccessProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [asking, setAsking] = useState(false);
  const [entered, setEntered] = useState("");
  const [wrong, setWrong] = useState(false);
  const presses = useRef<number[]>([]);
  const clear = useRef<number | undefined>(undefined);

  const press = useCallback(() => {
    const now = Date.now();
    presses.current = [...presses.current, now].filter((at) => now - at < WINDOW_MS);
    if (presses.current.length < PRESSES) return;

    presses.current = [];
    setEntered("");
    setWrong(false);
    setAsking(true);
  }, []);

  /** Judged on the press that completes it, rather than from an effect. */
  const type = (key: string) => {
    if (key === "⌫") {
      setEntered((value) => value.slice(0, -1));
      return;
    }

    const next = (entered + key).slice(0, 4);
    setEntered(next);
    if (next.length < 4) return;

    if (next === STAFF_PASSCODE) {
      setAsking(false);
      navigate({ to: "/pair" });
      return;
    }

    setWrong(true);
    clear.current = window.setTimeout(() => {
      setEntered("");
      setWrong(false);
    }, 900);
  };

  useEffect(() => () => window.clearTimeout(clear.current), []);

  const value = useMemo(() => ({ press }), [press]);

  return (
    <StaffAccessContext.Provider value={value}>
      {children}

      {asking && (
        <div
          role="dialog"
          aria-modal
          aria-label="Staff passcode"
          className="absolute inset-0 z-50 grid place-content-center bg-ink/40"
        >
          <div className="w-[420px] rounded-[16px] bg-parchment-light px-[40px] py-[36px] text-center">
            <h2 className="font-display text-[28px] font-light text-ink">Staff passcode</h2>

            <div className="mt-[24px] flex justify-center gap-[14px]">
              {[0, 1, 2, 3].map((slot) => (
                <span
                  key={slot}
                  className={`size-[18px] rounded-full border transition-colors ${
                    wrong
                      ? "border-brick bg-brick"
                      : entered.length > slot
                        ? "border-ink bg-ink"
                        : "border-ink"
                  }`}
                />
              ))}
            </div>

            <p className="mt-[14px] h-[20px] text-[16px] text-brick">
              {wrong ? "Not that one." : ""}
            </p>

            <div className="mt-[16px] grid grid-cols-3 gap-[12px]">
              {KEYS.map((key, index) =>
                key === "" ? (
                  <span key={index} />
                ) : (
                  <button
                    key={index}
                    type="button"
                    onClick={() => type(key)}
                    className="h-[56px] rounded-full border border-ink text-[22px] text-ink"
                  >
                    {key}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              onClick={() => setAsking(false)}
              className="mt-[24px] text-[18px] text-ink-soft underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </StaffAccessContext.Provider>
  );
}

export function useStaffAccess(): StaffAccessValue {
  const value = useContext(StaffAccessContext);
  if (!value) throw new Error("useStaffAccess must be used inside <StaffAccessProvider>");
  return value;
}
