import { useEffect } from "react";

/**
 * The paper the stage sits on.
 *
 * The design is a fixed 1194 × 834 frame, so on any screen that is not exactly
 * that shape there is space left over around it. Rather than leave a dark bar,
 * the surround is painted in the same ground as the screen inside it, and the
 * leftover reads as a margin instead of a fault.
 *
 * Every screen with a `<Backdrop>` sets this for free; a screen that draws its
 * own ground calls it directly.
 */
export type StageTone = "parchment" | "forest";

const COLOURS: Record<StageTone, string> = {
  parchment: "var(--color-parchment)",
  forest: "var(--color-forest-dark)",
};

export function useStageTone(tone: StageTone = "parchment") {
  useEffect(() => {
    document.documentElement.style.setProperty("--stage-surround", COLOURS[tone]);
  }, [tone]);
}
