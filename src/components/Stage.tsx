import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

const STAGE_WIDTH = 1194;
const STAGE_HEIGHT = 834;

/**
 * The design is drawn at a fixed 1194 x 834 (iPad Pro 11" landscape), which is
 * the kiosk's native resolution. Rather than make every screen responsive, the
 * whole frame is scaled to fit whatever viewport it lands in, so positions from
 * Figma stay exact.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fit = () => {
      setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-forest-dark">
      <div
        ref={frameRef}
        className="absolute left-1/2 top-1/2 overflow-hidden bg-parchment"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
