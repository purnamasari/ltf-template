import { POSTCARD_ART } from "../../components/Postcard";
import { ASSETS } from "../assets";
import { formatStampDate } from "../date";
import type { DeliveredPostcard } from "./postcard";

/**
 * The download sheet, drawn from frame `4875:3054` ("Download Preview").
 *
 * A5 portrait, both sides of the card stacked and flush: the picture side at
 * the top, the written side under it, each one A6 landscape scaled to the
 * sheet's width. Not two files and not a contact sheet — one page the
 * recipient can print or keep.
 */
const SHEET = { width: 420, height: 595, top: 2, gap: 1 } as const;

/** Each side is A6 landscape, scaled to the sheet's width. */
const SIDE = {
  width: SHEET.width,
  height: Math.round((SHEET.width / POSTCARD_ART.width) * POSTCARD_ART.height),
} as const;

/**
 * 840 x 1190 — about 144dpi at A5, which is sharp on any screen and prints
 * cleanly at postcard size. Measured against the sample card: scale 2 is a
 * 1.9MB PNG and scale 3 is 3.9MB, and doubling the file to gain resolution
 * nobody asked for is a poor trade on the phone this is usually opened on.
 * Callers that want a print-resolution sheet pass their own scale.
 */
const DEFAULT_SCALE = 2;

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

/**
 * Canvas has no notion of a wrapping paragraph, so the letter is broken the
 * same way the browser breaks it: greedily, on whitespace, at the same width.
 * Newlines the guest typed are kept — the written side renders `pre-wrap`.
 */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    let line = "";

    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > width) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }

    lines.push(line);
  }

  return lines;
}

/** The picture side, or the grey stand-in a category without artwork keeps. */
async function drawFront(
  ctx: CanvasRenderingContext2D,
  postcard: DeliveredPostcard,
  y: number,
) {
  const { placeholder } = POSTCARD_ART;

  if (!postcard.design.image) {
    ctx.fillStyle = placeholder.fill;
    ctx.fillRect(0, y, SIDE.width, SIDE.height);
    ctx.fillStyle = placeholder.colour;
    ctx.font = `italic ${placeholder.size}px "Lato", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(postcard.design.title, SIDE.width / 2, y + SIDE.height / 2);
    return;
  }

  const art = await load(postcard.design.image);

  // `object-cover`: fill the box, crop the overhang, never letterbox.
  const scale = Math.max(SIDE.width / art.width, SIDE.height / art.height);
  const w = art.width * scale;
  const h = art.height * scale;
  ctx.drawImage(art, (SIDE.width - w) / 2, y + (SIDE.height - h) / 2, w, h);
}

/**
 * The written side, re-drawn from `POSTCARD_ART` — the same numbers the DOM
 * version lays out with, scaled from the 595-wide frame to the sheet's width.
 */
async function drawBack(
  ctx: CanvasRenderingContext2D,
  postcard: DeliveredPostcard,
  y: number,
) {
  const { rule, letter, stamp, mark, dateline, textureOpacity } = POSTCARD_ART;
  const scale = SIDE.width / POSTCARD_ART.width;

  ctx.save();
  ctx.translate(0, y);
  ctx.beginPath();
  ctx.rect(0, 0, SIDE.width, SIDE.height);
  ctx.clip();
  ctx.scale(scale, scale);

  ctx.fillStyle = "#fffef0";
  ctx.fillRect(0, 0, POSTCARD_ART.width, POSTCARD_ART.height);

  const [texture, stampArt, markArt] = await Promise.all([
    load(ASSETS.paperTexture),
    load(ASSETS.stamp),
    load(ASSETS.logoMark),
  ]);

  ctx.save();
  ctx.globalAlpha = textureOpacity;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(texture, 0, 0, POSTCARD_ART.width, POSTCARD_ART.height);
  ctx.restore();

  ctx.fillStyle = rule.colour;
  ctx.fillRect(rule.x, rule.y, rule.w, rule.h);

  ctx.fillStyle = "#3a2517";
  ctx.font = `italic ${letter.size}px "Lato", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // `top` is the top of the text box; the first baseline sits a line into it.
  wrap(ctx, postcard.letter, letter.w).forEach((line, index) => {
    ctx.fillText(line, letter.x, letter.y + letter.size + index * letter.leading);
  });

  ctx.drawImage(stampArt, stamp.x, stamp.y, stamp.w, stamp.h);
  ctx.drawImage(markArt, mark.x, mark.y, mark.w, mark.h);

  ctx.fillStyle = dateline.colour;
  ctx.textAlign = "center";
  const centre = dateline.x + dateline.w / 2;
  ctx.font = `italic ${dateline.size}px "Lato", sans-serif`;
  ctx.fillText("Raffles Singapore,", centre, dateline.y + dateline.size);
  ctx.font = `900 ${dateline.dateSize}px "Lato", sans-serif`;
  ctx.fillText(formatStampDate(postcard.writtenOn), centre, dateline.y + dateline.size + 17);

  ctx.restore();
}

/** `raffles-postcard-<id>.png` — what the Download button saves. */
export function sheetFilename(postcard: DeliveredPostcard) {
  return `raffles-postcard-${postcard.id}.png`;
}

/**
 * Render the sheet and hand back the PNG. Async because the artwork, the stamp
 * and the paper grain are all fetched, and because the letter cannot be broken
 * into lines until Lato is actually loaded — measured against a fallback face
 * the wrap points come out wrong.
 */
export async function renderDownloadSheet(
  postcard: DeliveredPostcard,
  scale: number = DEFAULT_SCALE,
): Promise<Blob> {
  await document.fonts?.ready;

  const canvas = document.createElement("canvas");
  canvas.width = SHEET.width * scale;
  canvas.height = SHEET.height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot render the download sheet.");

  ctx.scale(scale, scale);
  ctx.fillStyle = "#fffef0";
  ctx.fillRect(0, 0, SHEET.width, SHEET.height);

  await drawFront(ctx, postcard, SHEET.top);
  await drawBack(ctx, postcard, SHEET.top + SIDE.height + SHEET.gap);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The sheet could not be encoded."))),
      "image/png",
    );
  });
}
