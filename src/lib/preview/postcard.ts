import type { PostcardDesign } from "../designs";
import { POSTCARD_DESIGNS } from "../designs";

/**
 * One delivered postcard, as the recipient's link renders it.
 *
 * Deliberately not `PostcardDraft`: the draft is a session being edited on the
 * kiosk, this is a finished card read years later. They will diverge — the
 * draft grows fields for the delivery channel, this one for the delivery date
 * and the sender — and nothing good comes of one type trying to be both.
 */
export type DeliveredPostcard = {
  id: string;
  design: PostcardDesign;
  letter: string;
  /** The day the card was written at the kiosk, stamped on the picture side. */
  writtenOn: Date;
};

/** The card the mock hands back until the backend pass lands. */
export const SAMPLE_POSTCARD: DeliveredPostcard = {
  id: "sample",
  design: POSTCARD_DESIGNS.find((design) => design.image) ?? POSTCARD_DESIGNS[0],
  letter:
    "Hey future me! Take a breath and look around, how much has changed since " +
    "today? I hope you're feeling proud of the progress we made, even the " +
    "small, quiet wins that nobody else noticed. Did you finally finish those " +
    "big projects we were stressing over? Are you still staying curious and " +
    "making time for the things that bring genuine joy? Remember why we " +
    "started all this: to grow, learn, and stay grounded. If things are tough " +
    "right now, trust yourself to handle it like we always do. Be kind to " +
    "yourself today, keep pushing forward, and don't forget to celebrate how " +
    "far you've come.",
  writtenOn: new Date(2026, 8, 1),
};
