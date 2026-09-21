import { useRouterState } from "@tanstack/react-router";

/** The track the frames draw, in frame px. */
const TRACK = 1193;

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
 * The frames draw a bar per screen at widths that no longer form a ladder —
 * `name` still carries the fill it had before it moved ahead of the picker — so
 * the width here is simply how far through the steps the guest is. Splitting it
 * evenly also makes the movement between two steps a constant, which a fixed
 * fill taken from each frame could not promise.
 *
 * Living above the routes is what lets it animate: the element survives the
 * navigation, so the width transitions from one step to the next instead of the
 * bar being torn down and rebuilt at its new length.
 */
export function FlowProgress() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const step = STEPS.indexOf(pathname as (typeof STEPS)[number]);

  if (step === -1) return null;

  return (
    <div aria-hidden className="absolute left-0 top-0 z-40 h-[9px] bg-track" style={{ width: TRACK }}>
      <div
        className="h-full bg-forest transition-[width] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: ((step + 1) / STEPS.length) * TRACK }}
      />
    </div>
  );
}
