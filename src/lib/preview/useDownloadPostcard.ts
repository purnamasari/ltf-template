import { useCallback, useState } from "react";
import { downloadPostcard } from "./download";
import type { DeliveredPostcard } from "./postcard";

/**
 * The Download button's one hook.
 *
 * The sheet is drawn rather than fetched — artwork, stamp, paper grain and the
 * webfont all have to be in hand before a pixel of it is right — so saving is
 * asynchronous and can fail. Which of those is the button's business; none of
 * it is the screen's.
 */
export function useDownloadPostcard() {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = useCallback(async (postcard: DeliveredPostcard) => {
    setSaving(true);
    setFailed(false);

    try {
      await downloadPostcard(postcard);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }, []);

  return { save, saving, failed };
}
