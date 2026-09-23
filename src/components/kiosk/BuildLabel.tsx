import { useEffect, useState } from "react";

/**
 * Which build the tablet is running, set small in the top-right corner.
 *
 * The kiosk keeps its own copy of the app and only takes a new one once it has
 * sat on the cover, so a tablet can be a deploy or two behind the site. This
 * says which, without anyone having to ask.
 *
 * Adding `?debug` to the address also shows what the stage measured — the
 * screen, the part above a keyboard, the scale and the lift — which is what is
 * needed to tell a real fitting bug from a stale copy. It is remembered for the
 * tab, because moving between screens drops the query.
 */
type BuildLabelProps = { scale: number; lift: number; height: number };

const DEBUG_KEY = "ltf-debug";

function debugOn(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has("debug")) {
      sessionStorage.setItem(DEBUG_KEY, "1");
    }
    return sessionStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return new URLSearchParams(window.location.search).has("debug");
  }
}

export function BuildLabel({ scale, lift, height }: BuildLabelProps) {
  const [debug] = useState(debugOn);
  const [visible, setVisible] = useState(() => window.visualViewport?.height ?? window.innerHeight);

  useEffect(() => {
    if (!debug) return;
    const read = () => setVisible(Math.round(window.visualViewport?.height ?? window.innerHeight));
    window.visualViewport?.addEventListener("resize", read);
    window.addEventListener("resize", read);
    return () => {
      window.visualViewport?.removeEventListener("resize", read);
      window.removeEventListener("resize", read);
    };
  }, [debug]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-[10px] top-[14px] z-50 select-none whitespace-nowrap text-right font-mono text-[10px] leading-[14px] text-ink-muted opacity-60"
    >
      {__BUILD_ID__}
      {debug && (
        <div>
          {window.innerWidth}×{window.innerHeight} · fit {Math.round(height)} · visible {Math.round(visible)} · ×
          {scale.toFixed(3)} · lift {lift}
        </div>
      )}
    </div>
  );
}
