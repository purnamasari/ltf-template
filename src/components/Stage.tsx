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

/**
 * How much the frame is scaled by. The bleed layer is unscaled, so anything
 * rendered into it that should match the frame's weight — a 9px bar drawn on
 * the top edge — has to apply this itself.
 */
const ScaleContext = createContext(1);

export const useStageScale = () => useContext(ScaleContext);

/** The unscaled layer behind the frame, filled by `<Bleed>`. */
export function Bleed({ children }: { children: ReactNode }) {
  const ground = useContext(GroundContext);
  return ground ? createPortal(children, ground) : null;
}

export function Stage({ children }: { children: ReactNode }) {
  const [{ scale, portrait }, setFit] = useState({ scale: 1, portrait: false });
  const [ground, setGround] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const fit = () => {
      /*
       * `visualViewport` is what is actually visible: in a browser tab it
       * excludes the URL bar, and it settles correctly after a rotation, where
       * `innerHeight` can report the previous orientation for a frame.
       */
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;

      setFit({
        scale: Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT),
        portrait: height > width,
      });
    };

    fit();

    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    window.visualViewport?.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("scroll", fit);

    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      window.visualViewport?.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("scroll", fit);
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
        <GroundContext.Provider value={ground}>
          <ScaleContext.Provider value={scale}>{children}</ScaleContext.Provider>
        </GroundContext.Provider>
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
