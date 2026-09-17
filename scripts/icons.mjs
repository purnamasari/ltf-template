#!/usr/bin/env node
/**
 * Generates the PWA icon set from the postage stamp artwork, on the parchment
 * ground the app uses. Run `node scripts/icons.mjs` after changing either.
 *
 * These are a stand-in. The design file has no home-screen icon yet — when one
 * lands, drop it in as the source and the sizes regenerate from it.
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const SOURCE = "public/assets/stamp.png";
const OUT = "public/icons";
const PARCHMENT = "#e2e0d1";

/** Maskable icons are cropped to a circle by the platform — keep art inside 80%. */
const SIZES = [
  { file: "icon-192.png", size: 192, inset: 0.78 },
  { file: "icon-512.png", size: 512, inset: 0.78 },
  { file: "icon-maskable-512.png", size: 512, inset: 0.56 },
  { file: "apple-touch-icon.png", size: 180, inset: 0.78 },
];

mkdirSync(OUT, { recursive: true });

for (const { file, size, inset } of SIZES) {
  const art = Math.round(size * inset);
  const stamp = await sharp(SOURCE)
    .resize(art, art, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: PARCHMENT },
  })
    .composite([{ input: stamp, gravity: "centre" }])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(`${OUT}/${file}`);

  console.log(`${OUT}/${file} — ${size}×${size}`);
}
