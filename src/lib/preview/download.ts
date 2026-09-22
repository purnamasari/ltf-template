import type { DeliveredPostcard } from "./postcard";
import { renderDownloadSheet, sheetFilename } from "./sheet";

/**
 * Save the card. Not the picture side on its own — the A5 sheet from frame
 * `4875:3054`, with both sides on it, drawn by `renderDownloadSheet`.
 */
export async function downloadPostcard(postcard: DeliveredPostcard) {
  const blob = await renderDownloadSheet(postcard);
  const href = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = href;
  link.download = sheetFilename(postcard);
  document.body.append(link);
  link.click();
  link.remove();

  // Freed on the next turn of the loop; revoking it now cancels the save.
  setTimeout(() => URL.revokeObjectURL(href), 0);
}
