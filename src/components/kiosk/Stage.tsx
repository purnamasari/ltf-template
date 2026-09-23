import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

const STAGE_WIDTH = 1194;
const STAGE_HEIGHT = 834;

/**
 * The design is drawn at a fixed 1194 x 834 (iPad Pro 11" landscape), which is
 * the kiosk's native resolution. Rather than make every screen responsive, the
 * whole frame is scaled to fit whatever viewport it lands in, so positions from
 * Figma stay exact.
 *
 * It is scaled to **fit**, never to fill: the progress bar sits on the very top
 * edge of the frame and the footer link close to the bottom, so cropping to fill
 * a taller screen would slice both.
 *
 * What is left over is not a margin but more paper. The ground — flat colour,
 * the linen texture, the vignette — is rendered into the layer below at the size
 * of the screen rather than the size of the frame, so it runs to the edges on
 * any tablet. Only the ground: it has no geometry to get wrong, unlike type or a
 * circle, so covering more of it is unnoticeable. Everything with a position
 * from Figma stays inside the frame at one uniform scale.
 */
const GroundContext = createContext<HTMLElement | null>(null);

/**
 * How much the frame is scaled by. The bleed layer is unscaled, so anything
 * rendered into it that should match the frame's weight — a 9px bar drawn on
 * the top edge — has to apply this itself.
 */
const ScaleContext = createContext(1);

export const useStageScale = () => useContext(ScaleContext);

/**
 * Where the frame sits, for content in `<Sky>` that has to line up with it: the
 * height the stage was fitted to, and how far the frame is currently lifted
 * clear of an on-screen keyboard.
 */
const MetricsContext = createContext({ scale: 1, height: STAGE_HEIGHT, lift: 0 });

/**
 * Where the on-screen keyboard begins, in the design's own coordinates, or null
 * when there is no keyboard. A screen with a tall field — the letter — uses it
 * to keep the part being typed into above the keyboard.
 */
const KeyboardContext = createContext<number | null>(null);

export const useKeyboardTop = () => useContext(KeyboardContext);

const SkyContext = createContext<HTMLElement | null>(null);

/** The unscaled layer behind the frame, filled by `<Bleed>`. */
export function Bleed({ children }: { children: ReactNode }) {
  const ground = useContext(GroundContext);
  return ground ? createPortal(children, ground) : null;
}

/**
 * The counterpart above the frame, at the size of the screen.
 *
 * A dimmer cannot use `<Bleed>`: that layer is behind the frame, so a scrim put
 * there would be covered by the very screen it is meant to dim. Anything that
 * has to cover everything — the scrim of a modal — goes here instead, and the
 * modal's own card goes inside a `<StageFrame>` so it keeps its position from
 * Figma.
 *
 * The layer ignores the pointer; whatever is rendered into it takes it back.
 */
export function Sky({ children }: { children: ReactNode }) {
  const sky = useContext(SkyContext);
  return sky ? createPortal(children, sky) : null;
}

/**
 * A box the size of the frame, scaled and centred exactly as the frame is, for
 * content in `<Sky>` that is positioned in the design's coordinates.
 */
export function StageFrame({ children }: { children: ReactNode }) {
  const { scale, height, lift } = useContext(MetricsContext);
  return (
    <div
      className="pointer-events-none absolute left-1/2"
      style={{
        top: height / 2,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
        transform: `translate(-50%, -50%) translateY(${-lift}px) scale(${scale})`,
        transition: LIFT_TRANSITION,
      }}
    >
      {children}
    </div>
  );
}

/** Space kept between a field and the top of the keyboard, in design pixels. */
const KEYBOARD_MARGIN = 40;

/**
 * How much of a tall field has to be above the keyboard. A one-line field is
 * shown whole; the letter only needs its first lines lifting into view, because
 * it trims itself to the room that is left (see `useKeyboardTop`).
 */
const KEYBOARD_REVEAL = 90;

/** Roughly the keyboard's own animation, so the design rises with it. */
const LIFT_TRANSITION = "transform 260ms cubic-bezier(0.2, 0, 0, 1)";

/** How long after a field loses focus a shrinking screen is still the keyboard. */
const KEYBOARD_SETTLE_MS = 800;

type Fit = { width: number; height: number; scale: number; portrait: boolean };

function fitTo(width: number, height: number): Fit {
  return {
    width,
    height,
    scale: Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT),
    portrait: height > width,
  };
}

/** The layout viewport — never `visualViewport`, which a keyboard shrinks. */
const measure = () => fitTo(window.innerWidth, window.innerHeight);

const isField = (el: Element | null): el is HTMLElement =>
  !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");

/**
 * A field's position in the design's own coordinates, walked up the layout
 * offsets rather than read off the screen — so it is the same whether or not
 * the frame is mid-lift, or a field is mid-transition.
 */
function positionInFrame(el: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && !node.hasAttribute("data-stage-frame")) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node ? { y, height: el.offsetHeight } : null;
}

/*
 * Why the stage used to shrink when a keyboard opened: it measured
 * `visualViewport`, which is exactly the part of the screen a keyboard takes
 * away, and rescaled the whole design to fit what was left.
 *
 * Now the scale is set by the screen and never by the keyboard, whichever way a
 * browser handles one. iPad Safari and Chrome leave the page alone and shrink
 * only the visual viewport; some Android browsers shrink the page itself. Both
 * are covered by one rule: the stage is refitted when the screen gets wider,
 * narrower or taller, but a screen that only gets *shorter* while a guest is
 * typing is a keyboard, and is ignored.
 *
 * Instead of shrinking, the design keeps its size and is lifted just far enough
 * that the field being typed into sits above the keyboard, then set back down
 * when the keyboard goes.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [fit, setFit] = useState<Fit>(measure);
  const [{ lift, keyboardTop }, setKeyboard] = useState<{ lift: number; keyboardTop: number | null }>({
    lift: 0,
    keyboardTop: null,
  });
  const [ground, setGround] = useState<HTMLDivElement | null>(null);
  const [sky, setSky] = useState<HTMLDivElement | null>(null);

  /* The event handlers below read the fit without re-subscribing on every change. */
  const fitRef = useRef(fit);
  useLayoutEffect(() => {
    fitRef.current = fit;
  }, [fit]);

  /* ---- The scale: set by the screen, never by a keyboard. ---- */
  useEffect(() => {
    let typingEndedAt = 0;

    const typing = () =>
      isField(document.activeElement) || Date.now() - typingEndedAt < KEYBOARD_SETTLE_MS;

    const refit = () => {
      const current = fitRef.current;
      const next = measure();
      const widthChanged = next.width !== current.width;
      const taller = next.height > current.height;
      const shorter = next.height < current.height;

      if (widthChanged || taller || (shorter && !typing())) setFit(next);
    };

    const typed = () => {
      typingEndedAt = Date.now();
      // Catch whatever the screen settles at once the keyboard is fully away.
      window.setTimeout(refit, KEYBOARD_SETTLE_MS + 50);
    };

    window.addEventListener("resize", refit);
    window.addEventListener("orientationchange", refit);
    document.addEventListener("focusout", typed);
    return () => {
      window.removeEventListener("resize", refit);
      window.removeEventListener("orientationchange", refit);
      document.removeEventListener("focusout", typed);
    };
  }, []);

  /* ---- The lift: keep the field being typed into above the keyboard. ---- */
  useEffect(() => {
    let frame = 0;

    const place = () => {
      const { height, scale } = fitRef.current;
      const viewport = window.visualViewport;
      const visibleTop = viewport ? viewport.offsetTop : 0;
      const visibleBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;

      const field = document.activeElement;
      const at = isField(field) ? positionInFrame(field) : null;
      const keyboardUp = visibleBottom < height - 1;

      if (!at || !keyboardUp) {
        setKeyboard((current) =>
          current.lift === 0 && current.keyboardTop === null ? current : { lift: 0, keyboardTop: null },
        );
        return;
      }

      /* The frame's resting top edge on screen, before any lift. */
      const frameTop = (height - STAGE_HEIGHT * scale) / 2;
      const top = frameTop + at.y * scale;
      const bottom = frameTop + (at.y + Math.min(at.height, KEYBOARD_REVEAL)) * scale;
      const margin = KEYBOARD_MARGIN * scale;

      /* Far enough to clear the keyboard, never so far the field leaves the top. */
      const needed = Math.max(0, bottom + margin - visibleBottom);
      const next = Math.round(Math.min(needed, Math.max(0, top - visibleTop - margin)));
      const keyboardAt = (visibleBottom - (frameTop - next)) / scale;

      setKeyboard((current) =>
        current.lift === next && current.keyboardTop === keyboardAt
          ? current
          : { lift: next, keyboardTop: keyboardAt },
      );
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };

    /* Focus leaving one field may be focus arriving at another; look once it lands. */
    const blurred = () => {
      window.setTimeout(() => {
        schedule();
        // iOS pans the page to a field it thinks is hidden; put it back after.
        if (!isField(document.activeElement) && window.scrollY !== 0) window.scrollTo(0, 0);
      }, 50);
    };

    schedule();
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", blurred);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", blurred);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, [fit]);

  const { scale, portrait, height } = fit;

  return (
    <div
      data-surface="kiosk"
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--stage-surround, var(--color-parchment))" }}
    >
      {/*
        The whole sheet — ground and frame together — pinned to the height the
        stage was fitted to rather than to the page, and lifted as one.

        Pinned, because where a browser shrinks the page for its keyboard, a
        frame centred in the page would slide up by half the keyboard on its own.
        As one, because the ground carries things drawn to the screen's edges —
        the progress bar along the top — and a frame lifted over a ground that
        stayed put ran the Raffles mark into it. Lifted together, the page simply
        scrolls; what it uncovers at the bottom is under the keyboard.
      */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height, transform: `translateY(${-lift}px)`, transition: LIFT_TRANSITION }}
      >
        {/* The ground, at the size of the screen. Behind everything. */}
        <div ref={setGround} aria-hidden className="absolute inset-0 overflow-hidden" />

        <div
          data-stage-frame
          className="absolute left-1/2 top-1/2 overflow-hidden"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
            /* Hidden rather than unmounted, so nothing in the flow is lost to a
               guest who turns the tablet mid-postcard. */
            visibility: portrait ? "hidden" : "visible",
          }}
        >
          <GroundContext.Provider value={ground}>
            <SkyContext.Provider value={sky}>
              <ScaleContext.Provider value={scale}>
                <MetricsContext.Provider value={{ scale, height, lift }}>
                  <KeyboardContext.Provider value={keyboardTop}>{children}</KeyboardContext.Provider>
                </MetricsContext.Provider>
              </ScaleContext.Provider>
            </SkyContext.Provider>
          </GroundContext.Provider>
        </div>
      </div>

      {/* Above the frame, at the size of the screen. Ignores the pointer until
          something rendered into it asks for it. */}
      <div ref={setSky} className="pointer-events-none absolute inset-0 overflow-hidden" />

      {portrait && <TurnTheTablet />}
    </div>
  );
}

/**
 * The kiosk is landscape — the manifest asks for it, and the stand holds it that
 * way. A tablet picked up and turned would otherwise show the frame at half the
 * height of the screen, which looks like a fault rather than a wrong way up.
 */
function TurnTheTablet() {
  return (
    <div className="absolute inset-0 grid place-content-center px-[48px] text-center">
      <svg
        viewBox="0 0 64 64"
        aria-hidden
        className="mx-auto mb-[28px] h-[64px] w-[64px] text-ink-soft"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="20" y="6" width="24" height="38" rx="3" />
        <path d="M14 44a18 18 0 0 0 30 8" strokeLinecap="round" />
        <path d="M44 44v10h-10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <p className="font-display text-[34px] font-light leading-[42px] text-ink">
        Please turn the tablet
      </p>
      <p className="mt-[10px] text-[19px] text-ink-soft">
        The postcard is written landscape.
      </p>
    </div>
  );
}
