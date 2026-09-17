import { ASSETS } from "./assets";

export type PostcardDesign = {
  id: string;
  /** Rendered picture side of the postcard, 595 x 420 (A6 landscape). */
  image: string;
  /** Caption printed on the artwork; also used for the accessible name. */
  title: string;
};

/**
 * The picture side of each postcard is a finished archival artwork exported
 * from Figma — the caption and date are part of the artwork, so a new design
 * is a new file rather than something composed at runtime.
 */
export const POSTCARD_DESIGNS: PostcardDesign[] = [
  { id: "tiffin-room-1892", image: ASSETS.postcardTiffin, title: "The opening of Tiffin Room, 1892" },
  { id: "greetings-from-raffles", image: ASSETS.postcardGreetings, title: "Greetings from Raffles" },
];
