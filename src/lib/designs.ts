import { ASSETS } from "./assets";

export type PostcardDesign = {
  id: string;
  /** Category name, shown on the placeholder and used as the accessible name. */
  title: string;
  /** The line under the carousel on the picker. */
  caption: string;
  /**
   * Picture side, 595 x 420 (A6 landscape). Absent while the category is still
   * a placeholder in the file — `PostcardFront` draws the frame's own grey
   * stand-in for those, rather than guessing at artwork.
   */
  image?: string;
};

/**
 * The five postcard categories. The picture side of each is a finished archival
 * artwork: the caption and date are part of the artwork, so a new design is a
 * new export rather than something composed at runtime.
 */
export const POSTCARD_DESIGNS: PostcardDesign[] = [
  {
    id: "culinary-and-dining",
    title: "Culinary & Dining",
    caption:
      "Celebrating Raffles Singapore through the flavours, memorable dining experiences and traditions that have shaped its story.",
    image: ASSETS.postcardTiffin,
  },
  {
    id: "architecture-and-design",
    title: "Architecture & Design",
    caption:
      "The iconic façade, courtyards, interiors and distinctive details that define Raffles.",
  },
  {
    id: "heritage-and-stories",
    title: "Heritage & Stories",
    caption:
      "The history, personalities and memorable moments that have shaped its legacy.",
    image: ASSETS.postcardGreetings,
  },
  {
    id: "hospitality-and-people",
    title: "Hospitality & People",
    caption:
      "The warmth, service and human encounters that make the Raffles experience personal.",
  },
  {
    id: "atmosphere-and-moments",
    title: "Atmosphere & Moments",
    caption:
      "The sense of place, ambience and memorable experiences that visitors carry with them.",
  },
];
