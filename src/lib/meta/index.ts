import { API_BASE } from "../config";
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
  one_letter_per_address: boolean;
  device_pairing_required: boolean;
  sender: string;
};

/** Used until the first successful fetch, and if the tablet has never been online. */
export const META_FALLBACK: Meta = {
  max_body_chars: 512,
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
