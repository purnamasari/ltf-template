import { useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * How much room is left between the top of `ref` and the on-screen keyboard,
 * measured in the design's own units rather than screen pixels.
 *
 * The stage deliberately does not resize when a keyboard opens, so a field near
 * the bottom of the frame can end up behind it. A field given this as its height
 * keeps its whole scrolling box above the keyboard, which is what makes the
 * browser's own caret-following land somewhere the guest can see.
 *
 * `visualViewport` is the right measurement here, and only here: what is asked
 * is precisely where the keyboard is. Returns null when there is no keyboard, or
 * nothing to measure yet.
 */
/** The design frame's width, which is what `data-stage` is scaled from. */
const STAGE_WIDTH = 1194;

export function useKeyboardRoom(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): number | null {
  const [room, setRoom] = useState<number | null>(null);

  useEffect(() => {
    if (!active) {
      setRoom(null);
      return;
    }

    const measure = () => {
      const element = ref.current;
      const viewport = window.visualViewport;
      if (!element || !viewport) return setRoom(null);

      const box = element.getBoundingClientRect();

      /*
       * The scale comes from the stage, not from the element: the writing area
       * animates its width open when the prompts fold, and a keyboard that
       * arrives mid-transition would otherwise be measured against a width still
       * moving, which reads as far more room than there is.
       */
      const stage = element.closest("[data-stage]")?.getBoundingClientRect();
      const scale = stage ? stage.width / STAGE_WIDTH : 0;
      if (!scale) return setRoom(null);

      const keyboardTop = viewport.offsetTop + viewport.height;
      /* Nothing is covered — let the design's own height stand. */
      if (keyboardTop >= box.bottom) return setRoom(null);

      setRoom((keyboardTop - box.top) / scale);
    };

    measure();
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    return () => {
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [ref, active]);

  return room;
}
