# Frame registry and re-sync protocol

The Figma file:
[WIP / Raffles Heritage → Design](https://www.figma.com/design/HMYN8b4CKSRi2vwwSFznCS/WIP-_-Raffles-Heritage?node-id=3714-10662&m=dev)

## What the tooling trusts

**The parent section `3714:10662`, and nothing else.** That node holds the whole
kiosk flow and survives the way the design team actually works — duplicating a
frame, reworking the copy, deleting the original. A frame that goes through that
comes back with a new id, so frame ids are treated as a **cache**, not a key:
`/scan-frames` re-resolves them from the parent, matching on the frame's name and
its position on the canvas.

The one thing that would break it is the parent section itself being duplicated
wholesale. If that happens it is a one-line fix — `parent.nodeId` in
[`frames.json`](frames.json) — and everything below re-resolves on the next scan.

## The registry

[`frames.json`](frames.json) is the source of truth and the thing the scripts
read. The table below is generated from it — run `node scripts/frames.mjs table`
after editing the JSON rather than editing the table by hand.

`Figma name` fills in on the first `/scan-frames` run; it is what lets a
duplicated-and-replaced frame still be recognised. `Synced` is the date the frame
was last read from Figma and reconciled with the screen — bump it in the same
commit as the change.

<!-- frames:begin -->

| Route | Frame | Figma name | Node id | Implemented in | Synced |
| --- | --- | --- | --- | --- | --- |
| `/` | Cover / attract | alt 1 | `4734:6213` | `src/screens/Cover.tsx` | 2026-09-17 |
| `/intro` | Narration beat 1 | Introduction | `4734:4631` | `src/screens/Narration.tsx` | 2026-09-21 |
| `/intro` | Narration beat 2 | Introduction | `4929:5286` | `src/screens/Narration.tsx` | 2026-09-21 |
| `/intro` | Narration beat 3 | Introduction | `4929:5308` | `src/screens/Narration.tsx` | 2026-09-21 |
| `/design` | Design picker | choose a design | `4734:6117` | `src/screens/ChooseDesign.tsx` | 2026-09-21 |
| `/write` | Write, prompts open | writing setup | `4734:6165` | `src/screens/Write.tsx` | 2026-09-21 |
| `/write` | Write, prompts folded | writing setup | `4802:3536` | `src/screens/Write.tsx` | 2026-09-21 |
| `/preview` | Preview written side | preview | `4802:3876` | `src/screens/Preview.tsx` | 2026-09-21 |
| `/name` | How to be addressed | name | `4808:4040` | `src/screens/YourName.tsx` | 2026-09-21 |
| `/delivery` | E-mail or Wechat | email/wechat | `4808:5417` | `src/screens/Delivery.tsx` | 2026-09-21 |
| `/confirm` | Confirmation summary | confirmation | `4808:8058` | `src/screens/Confirmation.tsx` | 2026-09-21 |
| `/sending` | Posting the card | loading | `4836:10970` | `src/screens/Sending.tsx` | 2026-09-21 |
| `/thank-you` | Thank You (8s timeout) | Thank you | `4814:8120` | `src/screens/ThankYou.tsx` | 2026-09-17 |

<!-- frames:end -->

### Deliberate departures from the file

Re-read these before "fixing" a screen to match Figma — they are decisions, not
drift, and a blind re-sync will undo them.

- **Canela → Cormorant Garamond.** Licensed face, not bundled. Headline widths
  and line breaks differ slightly from every frame. See `src/index.css`.
- **Privacy and Terms is not a step.** It is a dialog above the flow
  (`src/components/terms.tsx`), opened from the footer link on every screen.
- **Progress bar widths are re-laddered, not taken from each frame.** The
  section moved `name` ahead of the picker, but the bars drawn inside the frames
  were not updated — `name` still carries the 767 it had when it came after
  preview. `STEP_FILL` in `src/components/chrome.tsx` holds the file's own
  ladder of values re-assigned to the file's own order. If the designer
  re-ladders the frames, take the widths from them again and delete this note.
- **Keyboard states in the frames are the iPadOS system keyboard.** Fields are
  ordinary `input`/`textarea`; nothing is drawn for it.
- **Three postcard categories have no artwork.** Architecture & Design,
  Hospitality & People and Atmosphere & Moments are placeholders in the file, so
  `PostcardFront` draws the frame's own grey stand-in rather than borrowing a
  picture from another category. `src/lib/designs.ts`.
- **One addition the frames do not draw:** the back chevron on narration beats 2
  and 3. The "Tap to continue" line is gone — the frames now put a Start Writing
  pill on every beat, greyed until the last.
- **The narration fades rather than types.** The frames are still, so motion is
  not the file's to specify; a typewriter read as a terminal rather than a
  heritage piece. Each beat fades up over 1.4s with a 14px rise, and a tap
  finishes it early.
- **Wechat is drawn on `4808:5417` and stays on screen, disabled.** The API
  lists `EMAIL` alone in `meta.channels` today; Wechat is scheduled for the
  first release after launch, once the official account exists. Tapping it says
  so rather than doing nothing, because a guest who wants Wechat should learn it
  is coming, not find it missing. It enables itself when the server lists it —
  no code change, no layout change.
- **No title picker on `/name`.** The API accepts `recipient.title`, but the
  frame does not draw one and the field is optional, so it is never sent.
- **The cover's Raffles mark is also a staff control.** Five presses inside two
  seconds opens a passcode dialog, and the passcode opens `/pair`. An invisible
  overlay, so the mark drawn in `4734:6213` is untouched. Only on the cover —
  a guest part-way through a postcard must not be able to fall into it.
- **The ground runs past the frame.** On a tablet that is not the design's
  shape, the paper, texture and vignette fill the screen rather than stopping at
  1194 × 834. Content is untouched, but the vignette lands further out than the
  frame draws it — 35px on a 13" iPad, 68px on a 16:10 tablet. A composition
  change worth a designer's eye.
- **"Please turn the tablet" is not in the file.** The frame is landscape and
  the manifest asks for landscape, but a tablet picked up and turned would show
  the stage at half the height of the screen. `Stage` covers that rather than
  letting it read as a fault.
- **`/pair` has no frame at all.** It is a staff screen, deliberately plain —
  see `src/screens/Pair.tsx`. Do not style it from the guest-facing frames.
- **The picture side of a postcard is flat artwork** exported at 595 × 420 with
  its caption and date baked in. The written side is composed at runtime.

## Why the protocol exists

A Figma MCP `get_code` call on a single dense frame can return tens of thousands
of tokens of generated markup — mostly absolutely-positioned divs and inline
hex. Pull two or three of those into a session that is also holding the codebase
and the backend work, and the useful context (the house conventions, the seam
rules, what you were actually doing) gets crowded out by material you are going
to throw away anyway. That is the failure mode, not the model.

So a Figma read is an **extraction step with its own session**, and its only
durable outputs are code, a registry row and a snapshot.

## The two commands

### `/scan-frames` — what moved, what is new

One `get_metadata` call on the parent section, saved straight to
`docs/design/snapshots/parent.json`, then `node scripts/frames.mjs scan` prints a
short table: frames whose id changed, frames renamed, rows whose frame has gone,
and frames with no row at all. Only that table reaches the conversation — the
dump is on disk and no one reads it.

This is the one page-level read that is worth making. Run it when the design team
says they have been busy, or on a Monday.

New frames are a **new screen**, not a sync: a route in `src/router.tsx`, a file
in `src/screens`, a step in the progress chrome, a registry entry. That is a
separate piece of work from reconciling an existing screen — do it as its own
session too.

### `/sync-frame <route-or-key>` — reconcile one screen

Takes a route or a registry key, resolves the current node id from the registry,
reads **only that node**, and reconciles it against the screen file. One frame per
session; `/clear` between frames, and between a design pass and a backend pass.

Cheapest tool that answers the question, in this order:

- `get_variable_defs` — tokens. Once per sync round, not per frame; the output
  belongs in `@theme` in `src/index.css`.
- `get_metadata` — the compact tree for that frame. This settles most syncs on
  its own, and gets diffed against the frame's stored snapshot.
- `get_image` — a render, when you need to see it.
- `get_code` — last resort, on the specific child node being rewritten, never on
  a whole frame if a smaller node will do. Reference, not output: the screen is
  written in the house idiom from [CLAUDE.md](../../CLAUDE.md).

### Snapshots

`docs/design/snapshots/<key>.json` holds the metadata for a frame as of its last
sync, and `parent.json` the last scan. They are committed, so the next sync
`diff`s against a real baseline instead of relying on someone remembering what
the screen used to look like — and the diff, rather than the whole tree, is what
gets read.

## When the backend arrives

`submitPostcard` in `src/lib/api.ts` is a stub. Point it at the real endpoint and
the Sending screen works unchanged. Keep it that way: request/response shapes in
`src/lib/api.ts`, the draft shape in `src/lib/flow.tsx`, screens unaware of both.
As long as that holds, a Figma re-sync and a backend change touch disjoint files
and can never conflict.
