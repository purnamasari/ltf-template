import { registerSW } from "virtual:pwa-register";

/**
 * Service worker registration and the kiosk's update policy.
 *
 * A kiosk cannot reload itself whenever a deploy lands — a guest may be four
 * lines into a letter. So a waiting worker is held, and the new build is taken
 * the next time the app is back at the cover with nobody using it.
 */

let pending = false;
let update: ((reload?: boolean) => Promise<void>) | null = null;

export function registerAppUpdates() {
  update = registerSW({
    immediate: true,
    onNeedRefresh() {
      pending = true;
    },
  });
}

export function updateIsPending(): boolean {
  return pending;
}

/**
 * Takes a waiting update, reloading the page. Only safe to call from the cover
 * screen, where there is no work in progress to lose.
 */
export function applyPendingUpdate() {
  if (!pending || !update) return;
  pending = false;
  void update(true);
}
