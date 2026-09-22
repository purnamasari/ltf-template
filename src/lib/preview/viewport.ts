import { useEffect, useState } from "react";

/** A6 landscape, the shape of every postcard. */
const CARD_RATIO = 595 / 420;

/**
 * Chrome above and below the card in the widest frame: the heading at the top
 * and the Download button at the bottom. Subtracting it before the card is
 * sized is what keeps a laptop's short viewport from pushing the button off the
 * bottom — the card gives up width so the page stays whole.
 */
const CHROME_HEIGHT = 330;

/** The card's width in the 1920 frame; it never grows past it. */
const MAX_CARD_WIDTH = 1048;

/** 393 - 2 * 21, the side gutter in the mobile frame. */
const GUTTER = 42;

function measure() {
  const width = window.visualViewport?.width ?? window.innerWidth;
  const height = window.visualViewport?.height ?? window.innerHeight;

  return {
    card: Math.max(
      240,
      Math.min(width - GUTTER, (height - CHROME_HEIGHT) * CARD_RATIO, MAX_CARD_WIDTH),
    ),
    /* Below this the written side is too small to read in place, and tapping
       the card opens it as a sheet instead. Matches Tailwind's `lg`. */
    compact: width < 1024,
  };
}

/**
 * The preview is responsive, so the one number the frames are built around —
 * how wide the card is — has to be measured rather than declared. `PostcardBack`
 * composes at 595 x 420 and scales, so it needs a px number, not a CSS `min()`.
 *
 * A `ResizeObserver` on the document element rather than `window.onresize`,
 * because a `resize` event is not the only way the viewport changes shape: an
 * embedded preview pane, a devtools split, a desktop app resizing its own web
 * view — all of them relayout the document without firing one, and the card
 * would keep whatever width it was first measured at while the CSS around it
 * moved to the other breakpoint. The observer sees the box itself change.
 */
export function useViewport() {
  const [fit, setFit] = useState(measure);

  useEffect(() => {
    const onResize = () => {
      const next = measure();
      // The observer fires on every layout; only a real change is a render.
      setFit((current) =>
        current.card === next.card && current.compact === next.compact ? current : next,
      );
    };

    const observer = new ResizeObserver(onResize);
    observer.observe(document.documentElement);

    /* The observer misses the one case that is not a layout change: a phone's
       URL bar sliding away, which changes the visible height and nothing else. */
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return fit;
}
