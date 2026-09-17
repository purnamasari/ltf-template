import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

/** Distance in px before a drag counts as a swipe rather than a tap. */
const THRESHOLD = 40;

type SwipeOptions = {
  /** "x" for a left/right carousel, "y" for a stacked one. */
  axis: "x" | "y";
  onNext: () => void;
  onPrevious: () => void;
};

/**
 * Swipe handling for the carousels. Pointer events cover both the kiosk's
 * touch screen and a mouse during development.
 */
export function useSwipe({ axis, onNext, onPrevious }: SwipeOptions) {
  const origin = useRef<{ x: number; y: number } | null>(null);

  const end = (event: ReactPointerEvent) => {
    const start = origin.current;
    origin.current = null;
    if (!start) return;

    const moved = axis === "x" ? event.clientX - start.x : event.clientY - start.y;
    const drift = axis === "x" ? event.clientY - start.y : event.clientX - start.x;

    // Ignore short drags and anything closer to the other axis.
    if (Math.abs(moved) < THRESHOLD || Math.abs(drift) > Math.abs(moved)) return;
    if (moved < 0) onNext();
    else onPrevious();
  };

  return {
    onPointerDown: (event: ReactPointerEvent) => {
      origin.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: end,
    onPointerCancel: () => {
      origin.current = null;
    },
    style: { touchAction: axis === "x" ? "pan-y" : "pan-x" } as const,
  };
}

/** Positive modulo, so the carousels wrap in both directions. */
export function wrapIndex(value: number, length: number) {
  return ((value % length) + length) % length;
}
