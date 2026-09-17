/**
 * Demo mode — a kiosk that behaves exactly like the real one with no backend
 * behind it, so the flow can be walked through and signed off on its own.
 *
 * Every seam the server sits behind is faked here and nowhere else: the real
 * modules branch once at the top of each call and are otherwise untouched, so
 * turning this off is a single environment variable rather than a revert.
 *
 * ON by default while the build is being reviewed. Set `VITE_DEMO_MODE=false`
 * to talk to the real API.
 */
export const DEMO = import.meta.env.VITE_DEMO_MODE !== "false";

/** Stands in for a bearer, so the tablet believes it was paired long ago. */
export const DEMO_BEARER = "ltf_demo_paired_device";

/** How long staff wait on the pairing screen before it "approves" itself. */
export const DEMO_APPROVAL_MS = 6_000;

/** Long enough for the postbox animation to read as a real hand-off. */
export const DEMO_SEND_MS = 1_200;

export const DEMO_CODE = "LTF-DEMO-8ZP2";

if (DEMO && typeof console !== "undefined") {
  console.warn(
    "[kiosk] DEMO MODE: pairing and delivery are simulated, nothing is sent. " +
      "Set VITE_DEMO_MODE=false for the real API.",
  );
}
