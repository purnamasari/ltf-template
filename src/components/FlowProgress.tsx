import { useRouterState } from "@tanstack/react-router";
import { Bleed, useStageScale } from "./Stage";

/** Height of the bar in frame px; scaled to match the frame it sits on. */
const BAR_HEIGHT = 9;

/**
 * The steps a guest walks through, in order. The cover, the thank you and the
 * pairing screen are not steps and show no bar at all.
 */
const STEPS = [
  "/intro",
  "/name",
  "/design",
  "/write",
  "/preview",
  "/delivery",
  "/confirm",
  "/sending",
] as const;

/**
 * The progress bar, owned by the flow rather than by a screen.
 *
 * Not taken from the frames. Each of them draws its own fill, and those widths
 * stopped forming a ladder when `name` moved ahead of the picker, so the width
 * here is how far through the steps the guest is.
 *
 * Two things follow from where it is mounted. It lives above the routes, so the
 * element survives a navigation and the width transitions between steps instead
 * of being rebuilt at its new length. And it renders through `<Bleed>`, so it
 * spans the screen rather than the 1193px the frame gives it: the stage scales
 * to fit, and a bar that stopped at the frame's edge would leave paper either
 * side of it on any tablet that is not the design's shape. It is safe to bleed
 * for the same reason the ground is — a flat rectangle on an edge has no
 * geometry to get wrong, and what carries the meaning is the proportion filled,
 * which is unaffected by how wide the screen is.
 */
export function FlowProgress() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const scale = useStageScale();
  const step = STEPS.indexOf(pathname as (typeof STEPS)[number]);

  if (step === -1) return null;

  return (
    <Bleed>
      <div
        aria-hidden
        className="absolute left-0 top-0 z-40 w-full bg-track"
        style={{ height: BAR_HEIGHT * scale }}
      >
        <div
          className="h-full bg-forest transition-[width] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </Bleed>
  );
}
