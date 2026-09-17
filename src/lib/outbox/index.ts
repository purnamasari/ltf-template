import { API_BASE } from "../config";
import { DEMO, DEMO_SEND_MS } from "../demo";
import { meta } from "../meta";
import { LETTERS, getAll, put, remove } from "../storage";
import { bearer, clearBearer } from "../pairing";

/**
 * The outbox.
 *
 * The tablet is the system of record until the server says otherwise, so a
 * sealed postcard is written to durable storage before any network call is
 * attempted, and the guest is never made to wait on the wifi.
 *
 * The idempotency key belongs to the **letter**, not to the HTTP attempt. It is
 * minted once, beside the body, and every retry carries the key the letter was
 * born with. Minting it per attempt looks correct, passes every test, and
 * delivers the same postcard twice a year later with nobody around to notice.
 */

export type Recipient = {
  channel: string;
  address: string;
  display_name?: string;
};

export type QueuedLetter = {
  /** UUID v4, minted at seal. Sent as the Idempotency-Key on every attempt. */
  id: string;
  state: "queued" | "confirmed";
  body: string;
  recorded_at: string;
  recipient: Recipient;
  attempts: number;
  nextAttemptAt: number;
  lastCode?: string;
  /** Kept after a 201; the body is dropped. */
  serverId?: string;
  statusToken?: string;
  scheduledAt?: string;
};

/** Roughly 5s, 30s, 2m, 10m, capped near fifteen minutes. */
const BACKOFF_MS = [5_000, 30_000, 120_000, 600_000, 900_000];

/** Everything in the building reconnects at once; jitter stops the stampede. */
function backoff(attempts: number): number {
  const base = BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)];
  return base * (0.8 + Math.random() * 0.4);
}

/** 4xx that name a content problem are final — retrying only fills the queue. */
const FINAL_CODES = new Set([
  "idempotency.key_required",
  "idempotency.key_reused",
  "letter.empty",
  "letter.too_long",
  "letter.recipient_already_used",
]);

export type SealInput = {
  body: string;
  recipient: Recipient;
};

/**
 * Everything that happens when the guest seals the postcard, in one step and
 * before any network call: the letter, the timestamp, and its idempotency key.
 */
export async function enqueue({ body, recipient }: SealInput): Promise<QueuedLetter> {
  const letter: QueuedLetter = {
    id: crypto.randomUUID(),
    state: "queued",
    body,
    recorded_at: new Date().toISOString(),
    recipient,
    attempts: 0,
    nextAttemptAt: 0,
  };

  await put(LETTERS, letter);
  return letter;
}

export async function queued(): Promise<QueuedLetter[]> {
  const all = await getAll<QueuedLetter>(LETTERS);
  return all.filter((letter) => letter.state === "queued");
}

export type SendOutcome =
  | { result: "confirmed"; letter: QueuedLetter }
  | { result: "rejected"; code: string }
  | { result: "retry" }
  | { result: "unpaired" };

/** One letter, one attempt. There is no batch endpoint and no need for one. */
export async function send(letter: QueuedLetter): Promise<SendOutcome> {
  if (DEMO) return demoSend(letter);

  const token = await bearer();
  if (!token) return { result: "unpaired" };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/v1/letters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": letter.id,
      },
      body: JSON.stringify({
        body: letter.body,
        recorded_at: letter.recorded_at,
        recipient: letter.recipient,
      }),
    });
  } catch {
    // Timeout or no response — the case the key exists for. The letter may
    // already be stored, so retry it with the key it was born with.
    await defer(letter);
    return { result: "retry" };
  }

  if (response.status === 401) {
    // Revoked in the dashboard. Never transient.
    await clearBearer();
    return { result: "unpaired" };
  }

  if (response.ok) {
    const body = (await response.json()) as {
      id: string;
      status_token: string;
      scheduled_at: string;
    };

    // The server has it. A museum tablet has no reason to hold a guest's words.
    const confirmed: QueuedLetter = {
      ...letter,
      state: "confirmed",
      body: "",
      serverId: body.id,
      statusToken: body.status_token,
      scheduledAt: body.scheduled_at,
    };
    await put(LETTERS, confirmed);
    return { result: "confirmed", letter: confirmed };
  }

  const problem = (await response.json().catch(() => ({}))) as { code?: string };
  const code = problem.code ?? `http_${response.status}`;

  if (FINAL_CODES.has(code)) {
    await remove(LETTERS, letter.id);
    return { result: "rejected", code };
  }

  // 429, 5xx and anything unrecognised: back off and try the same letter again.
  await defer(letter, code);
  return { result: "retry" };
}

/**
 * Walks the same path a real 201 takes — the record is confirmed, the body is
 * dropped — so what the demo shows is what the kiosk does.
 */
async function demoSend(letter: QueuedLetter): Promise<SendOutcome> {
  await new Promise((resolve) => setTimeout(resolve, DEMO_SEND_MS));

  const scheduled = new Date(letter.recorded_at);
  scheduled.setDate(scheduled.getDate() + meta().delivery_horizon_days);

  const confirmed: QueuedLetter = {
    ...letter,
    state: "confirmed",
    body: "",
    serverId: `demo-${letter.id.slice(0, 8)}`,
    statusToken: "demo",
    scheduledAt: scheduled.toISOString(),
  };
  await put(LETTERS, confirmed);
  return { result: "confirmed", letter: confirmed };
}

async function defer(letter: QueuedLetter, code?: string) {
  await put(LETTERS, {
    ...letter,
    attempts: letter.attempts + 1,
    nextAttemptAt: Date.now() + backoff(letter.attempts),
    lastCode: code,
  });
}

/**
 * Confirmed records keep only an id and a status token, but a busy gallery
 * seals hundreds a day. Nothing reads one after a month, so drop them.
 */
const KEEP_CONFIRMED_DAYS = 30;

export async function prune(): Promise<void> {
  const cutoff = Date.now() - KEEP_CONFIRMED_DAYS * 86_400_000;
  const all = await getAll<QueuedLetter>(LETTERS);

  for (const letter of all) {
    if (letter.state !== "confirmed") continue;
    if (Date.parse(letter.recorded_at) < cutoff) await remove(LETTERS, letter.id);
  }
}

/** Sends every letter that is due, oldest first, one at a time. */
export async function flush(): Promise<void> {
  const due = (await queued())
    .filter((letter) => letter.nextAttemptAt <= Date.now())
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  for (const letter of due) {
    const outcome = await send(letter);
    // No token, or it was just revoked — stop the loop rather than burn the queue.
    if (outcome.result === "unpaired") return;
  }
}
