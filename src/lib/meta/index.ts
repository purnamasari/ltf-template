import { API_BASE } from "../config";
import { DEMO } from "../demo";
import { KV, get, put } from "../storage";

/**
 * The server's own rules, read once at launch and cached.
 *
 * The form validates against these rather than against hard-coded guesses that
 * drift. If the call fails the last cached copy is used — an offline tablet
 * must still open.
 */
export type Meta = {
  max_body_chars: number;
  delivery_horizon_days: number;
  installation_tz: string;
  channels: string[];
  /** Present on the live server, unused here: the app never schedules. */
  min_schedule_seconds?: number;
  max_schedule_days?: number;
  one_letter_per_address: boolean;
  device_pairing_required: boolean;
  sender: string;
};

/**
 * Used until the first successful fetch, and if the tablet has never been
 * online. `max_body_chars` tracks the cap drawn on the counter in the writing
 * frames — it was 512 when they said 512 and is 600 now they say 600 — so an
 * offline kiosk holds the guest to the same limit the screen promises. A live
 * server's own value still wins.
 */
export const META_FALLBACK: Meta = {
  max_body_chars: 600,
  delivery_horizon_days: 365,
  installation_tz: "Asia/Singapore",
  channels: ["EMAIL"],
  one_letter_per_address: true,
  device_pairing_required: true,
  sender: "",
};

const CACHE_KEY = "meta";

let current: Meta = META_FALLBACK;

export function meta(): Meta {
  return current;
}

export async function loadMeta(): Promise<Meta> {
  // A demo should not depend on the venue's wifi, and the fallback already
  // carries the values the live server returns.
  if (DEMO) return current;

  const cached = await get<Meta>(KV, CACHE_KEY);
  if (cached) current = cached;

  try {
    const response = await fetch(`${API_BASE}/v1/meta`);
    if (response.ok) {
      current = (await response.json()) as Meta;
      await put(KV, current, CACHE_KEY);
    }
  } catch {
    // Offline at launch. The cached copy, or the fallback, stands.
  }

  return current;
}
