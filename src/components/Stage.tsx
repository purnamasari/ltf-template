import { createContext, useContext, useEffect, useState } from "react";
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

/** The unscaled layer behind the frame, filled by `<Bleed>`. */
export function Bleed({ children }: { children: ReactNode }) {
  const ground = useContext(GroundContext);
  return ground ? createPortal(children, ground) : null;
}

export function Stage({ children }: { children: ReactNode }) {
  const [{ scale, portrait }, setFit] = useState({ scale: 1, portrait: false });
  const [ground, setGround] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    /*
     * Whether a guest is typing. While they are, the stage does not re-measure
     * at all.
     *
     * Measuring the layout viewport rather than `visualViewport` is what stops
     * an Android keyboard rescaling the kiosk, but which viewport a platform
     * shrinks for its keyboard is its own business — iOS and Android have never
     * agreed, and `interactive-widget` is Chromium-only. Rather than depend on
     * that, the fit is frozen for as long as a field has focus: whatever the
     * browser does to its viewports while the keyboard is up, the design does
     * not move under the guest's hands.
     */
    const typing = () => {
      const el = document.activeElement;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
    };

    const fit = (force = false) => {
      if (typing() && !force) return;

      // The layout viewport, not `visualViewport` — see above.
      const width = document.documentElement.clientWidth || window.innerWidth;
      const height = document.documentElement.clientHeight || window.innerHeight;

      setFit({
        scale: Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT),
        portrait: height > width,
      });
    };

    /* A rotation is a real change and applies even mid-letter. */
    const rotated = () => fit(true);
    const measure = () => fit();

    /*
     * iOS scrolls a focused field into view, and it is left alone while the
     * guest is typing: on a screen too short to show the field above the
     * keyboard, that scroll is the only thing that makes the field visible at
     * all. It is put back once focus leaves, so the design never sits offset
     * with nothing being written.
     */
    const settled = () => {
      window.scrollTo(0, 0);
      window.setTimeout(() => fit(true), 100);
    };

    fit();

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", rotated);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    document.addEventListener("focusout", settled);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", rotated);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
      document.removeEventListener("focusout", settled);
    };
  }, []);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--stage-surround, var(--color-parchment))" }}
    >
      {/* The ground, at the size of the screen. Behind everything. */}
      <div ref={setGround} aria-hidden className="absolute inset-0 overflow-hidden" />

      <div
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
        <GroundContext.Provider value={ground}>{children}</GroundContext.Provider>
      </div>

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
