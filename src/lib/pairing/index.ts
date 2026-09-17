import { API_BASE } from "../config";
import { DEMO, DEMO_APPROVAL_MS, DEMO_BEARER, DEMO_CODE } from "../demo";
import { KV, get, put, remove } from "../storage";

/**
 * Device pairing: the tablet shows a code, a member of staff types it into the
 * dashboard, and the tablet polls until the bearer comes back.
 *
 * The bearer is returned **once**. Lose it and the tablet has to be paired
 * again, so it is written to storage before anything else happens.
 */

const TOKEN_KEY = "bearer";

export type PairingStart = {
  device_id: string;
  device_code: string;
  claim_token: string;
  pairing_state: "PAIRING";
};

export type PairingPoll = {
  pairing_state: "PAIRING" | "PAIRED";
  bearer_token: string | null;
};

let cached: string | null | undefined;

/** Demo only: when the imaginary member of staff gets round to approving. */
let demoApprovesAt = 0;

export async function bearer(): Promise<string | null> {
  if (DEMO) return DEMO_BEARER;
  if (cached !== undefined) return cached;
  cached = (await get<string>(KV, TOKEN_KEY)) ?? null;
  return cached;
}

async function store(token: string) {
  cached = token;
  await put(KV, token, TOKEN_KEY);
}

/**
 * Called on a 401. Revocation takes effect on the very next request, so a 401
 * is never transient: stop retrying, drop the token, go back to pairing.
 */
export async function clearBearer() {
  cached = null;
  await remove(KV, TOKEN_KEY);
}

/** Step 1 — ask to be paired. No auth; rate-limited to 5 per hour per IP. */
export async function startPairing(label: string): Promise<PairingStart> {
  if (DEMO) {
    demoApprovesAt = Date.now() + DEMO_APPROVAL_MS;
    return {
      device_id: "demo-device",
      device_code: DEMO_CODE,
      claim_token: "demo-claim",
      pairing_state: "PAIRING",
    };
  }

  const response = await fetch(`${API_BASE}/v1/devices/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  if (!response.ok) throw new Error(`pairing failed: ${response.status}`);
  return (await response.json()) as PairingStart;
}

/**
 * Step 3 — poll for the bearer. Returns true once paired. A 404 means the
 * window expired or the code was already claimed: start again at step 1.
 */
export async function pollPairing(claimToken: string): Promise<"pairing" | "paired" | "expired"> {
  if (DEMO) return Date.now() >= demoApprovesAt ? "paired" : "pairing";

  const response = await fetch(`${API_BASE}/v1/devices/pair/${claimToken}`);
  if (response.status === 404) return "expired";
  if (!response.ok) return "pairing";

  const result = (await response.json()) as PairingPoll;
  if (result.pairing_state === "PAIRED" && result.bearer_token) {
    await store(result.bearer_token);
    return "paired";
  }
  return "pairing";
}

/** Called at launch to confirm the stored token still works. Never in a loop. */
export async function checkDevice(): Promise<boolean> {
  if (DEMO) return true;

  const token = await bearer();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE}/v1/devices/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      await clearBearer();
      return false;
    }
    return response.ok;
  } catch {
    // Offline. The stored token is assumed good until a request says otherwise.
    return true;
  }
}
