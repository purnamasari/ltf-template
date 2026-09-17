# Letters API — the contract this kiosk implements

Condensed from the *Letter Kiosk Integration* spec. This file exists so a
session can implement against the API without re-reading the full document.
Where the two disagree, the spec wins.

- Base: `https://letters.dev.heydewi.com`
- Verified live 2026-09-17: `GET /v1/meta` → 200, shape as below. It also
  returns `min_schedule_seconds` and `max_schedule_days`, which this app ignores
  — it records, it does not schedule. Note `installation_tz` is
  **`Europe/Lisbon`** on the dev instance; a Singapore kiosk needs that changed
  server-side, as the server resolves the delivery date in that zone.
- Auth: device bearer, `Authorization: Bearer ltf_…` — header only, never a URL
- Errors: RFC 9457 problem documents. **Branch on `code`, never on `title`/`detail`.**

## The model

**The app records, the server schedules.** The tablet reports *when the letter
was written*; the server adds the horizon, resolves it in the museum's time
zone, and returns the date. There is no date field to send and no date picker to
build.

- Show the arrival date the server returns.
- Offline, show a date computed from `delivery_horizon_days` (from `meta`,
  cached at boot). The server's answer is the one of record.
- A wrong tablet clock is corrected server-side, never rejected.

## Pairing

One-time per device, and it proves the tablet is in the building in front of
staff.

1. `POST /v1/devices/pair` → `device_code` + `claim_token`
2. Tablet displays the code (e.g. `LTF-4K7Q-8ZP2`) for 2 minutes
3. Staff type it into the dashboard
4. Tablet polls `GET /v1/devices/pair/{claim_token}` every 3s
5. Bearer token returned **once** — store it, it is not re-issued

Code and claim token expire together after two minutes. Neither can submit a
letter; only the bearer can.

## The local queue

**The tablet is the system of record until the server says otherwise.** Design
for the network being absent, not for it flickering.

When the guest seals the postcard, three things happen locally **in one
transaction, before any network call**:

1. The letter is written to durable storage.
2. `recorded_at` is stamped from the device clock, UTC, ISO 8601.
3. A fresh **UUID v4** is generated and stored *in the same record*. This is the
   idempotency key.

> **The one mistake to avoid.** Generating the key per *request attempt* instead
> of per *letter*. It looks correct, passes every test, and duplicates in
> production — the guest receives the same letter twice, a year later, with
> nobody around to notice. Mint the key once, beside the body, never touch it
> again.

Sync when the app comes online, when it launches, and on a slow timer while the
queue is non-empty. One letter at a time; there is no batch endpoint.

## Submitting

`POST /v1/letters`, with `Authorization: Bearer …`, `Idempotency-Key: <the
letter's uuid>`, `Content-Type: application/json`.

```json
{
  "body": "Dear me, by the time you read this…",
  "recorded_at": "2026-08-28T14:31:09.482Z",
  "recipient": {
    "channel": "EMAIL",
    "address": "visitor@example.com",
    "display_name": "Chen",
    "title": "MS"
  }
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `body` | yes | Up to `max_body_chars`. Whitespace preserved exactly — a human reads it, line breaks matter. |
| `recorded_at` | on sync | UTC ISO 8601. Sending it **requires** the `Idempotency-Key` header. |
| `recipient.address` | yes | The guest's own address. One letter per address, for good. |
| `recipient.channel` | no | Defaults to `EMAIL`, **the only channel live today**. |
| `recipient.display_name` | no | ≤120 chars. Becomes the greeting and the name on the envelope. |
| `recipient.title` | no | `MR` `MRS` `MS` `MX` `DR` `PROF`. **Not sent.** The `/name` frame draws no title picker, and the design direction settles it. |

`201 Created` returns `id`, `status`, `scheduled_at`, `status_token` (shown
once) and `review_expected`. On success: mark confirmed, keep `id` and
`status_token`, **delete the body**.

`status` is `SCHEDULED` or `NEEDS_REVIEW`. Show the guest the same confirmation
either way — telling somebody their letter was flagged, at a kiosk, in front of
a queue, helps nobody, and most flags are approved.

## Responses

| HTTP | `code` | What the app does |
| --- | --- | --- |
| 201 | — | Confirmed. Delete the queued copy, keep `id` and `status_token`. |
| 201 | — | *(replay)* Same key twice returns the same stored response. Indistinguishable from the first — that is the point. Treat as success. |
| 400 | `idempotency.key_required` | Sent `recorded_at` without the header. A client bug: fix, do not retry. |
| 401 | — | Device revoked or token invalid. Clear storage, go to pairing, stop the sync loop. |
| 409 | `idempotency.key_reused` | Key on file against a *different* body. A key reused across letters. Do not retry; log it. |
| 422 | `letter.empty` | Whitespace only. Block in the form. |
| 422 | `letter.too_long` | Over `max_body_chars`. Block in the form. |
| 422 | `letter.recipient_already_used` | This address already has a letter. Drop the queued copy, tell the guest plainly. **Never retry.** |
| 429 | `rate_limited` | Back off, retry the same letter with the same key. |
| 5xx | `internal_error` | Retry the same letter with the same key. |
| — | timeout / silence | Retry with the same key. **This is the case the key exists for** — the letter may already be stored. |

**Two buckets, and the split is what matters.** 4xx naming a content problem are
final; retrying changes nothing and fills the queue. 429, 5xx and silence are
transient; retry, always with the original key.

**Backoff:** exponential with jitter — roughly 5s, 30s, 2m, 10m, capped near
fifteen minutes. Everything in the building reconnects the moment the wifi
returns; the jitter is what stops the stampede.

## Status (staff diagnostics only)

`GET /v1/letters/{id}` with `X-Status-Token`. Status only — the body is never
returned to any client, and a missing letter and a wrong token give the same
404, so it cannot be used to enumerate letters. Not for guests.

## Limits

| Limit | Value |
| --- | --- |
| Letter length | Read from `meta` — the spec's example says 10 000, the dev server returns **512**, which is also the design's cap. Never hard-code either. |
| Per address | 1, lifetime |
| Per device | 60/hour, 400/day |
| Pairing requests | 5/hour/IP (the whole building is one address) |
| Pairing code life | 2 minutes |

## Must not

- **No date picker.** The horizon is fixed and server-side. Show the date.
- **No local delivery scheduling.** The app records and syncs; that is the job.
- **Never regenerate an idempotency key on retry.**
- **Never show moderation state to a guest.** `review_expected` is for logs.
- **Never keep a letter body after a 201.**
- **Never log letter bodies or addresses** — no file, no crash reporter, no
  analytics event.
- **Never put the bearer in a URL** or anything that gets logged. Header only.

## Ship checklist

- Airplane mode: write three letters, relaunch, restore network — all three
  arrive, each exactly once.
- Kill the app mid-sync — the letter arrives once, not twice.
- Set the clock a year fast, submit — `scheduled_at` is still about a year out.
- Submit the same address twice — second refused with
  `letter.recipient_already_used` and leaves the queue.
- Revoke the device — next sync 401s and the app returns to pairing.
- Let a pairing code expire, request a new one.
- Relaunch after pairing — stored bearer still works, no re-pairing.
- Grep the build for the bearer, bodies and addresses in log output. Nothing.
