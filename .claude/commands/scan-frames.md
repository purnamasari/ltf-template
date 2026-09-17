---
description: Re-resolve frame ids from the Figma parent section and report what is new, moved or gone
---

Find out what the design team has changed, without reading any frame's contents.

1. Read `docs/design/frames.json` and take `parent.nodeId`. That section is the
   only id this project trusts; every frame id in the registry is a cache.
2. Call `get_metadata` on the parent node, asking for the shallowest tree the
   server will give you. Save the output **verbatim** to
   `docs/design/snapshots/parent.json`. Do not summarise it, quote it back, or
   read it beyond checking that it is JSON with a `children` array.
3. Run `node scripts/frames.mjs scan docs/design/snapshots/parent.json`. The
   table it prints is all you need; work from that, not from the dump.
4. Act on each state:
   - `ok` / `learned` — nothing to do.
   - `re-id` — a frame was duplicated and replaced. The script matched it by
     name; sanity-check the route makes sense, then re-run with `--apply`.
   - `renamed` — confirm it is the same screen and not a repurposed frame, then
     `--apply`.
   - `missing` with no `NEW` frame — the screen was deleted from the design. Ask
     before deleting code.
   - `missing` alongside a `NEW` frame — almost always one screen rebuilt under
     a new name, which the name match could not catch. Ask the designer which it
     is. Do not guess.
   - `NEW` with nothing missing — a genuinely new screen. See below.
5. Once `--apply` has written the resolved ids, run `node scripts/frames.mjs
   table` to regenerate the table in `docs/design/frames.md`, and commit both
   files together with the snapshot.

**Do not implement anything in this session.** A scan ends with a report and a
committed registry. Reconciling a changed screen is `/sync-frame`; a new screen
is the work below — both start fresh, after `/clear`.

**A new frame is a new screen, not a sync.** It needs a route in
`src/router.tsx`, a file in `src/screens`, a step added to the progress chrome in
`src/components/chrome.tsx` (the bar widths come from the frames), any new field
carried in `src/lib/flow.tsx`, and a registry entry with its own `key`. Check
with the user before adding one — a new step changes the flow the guest walks
through, which is a product decision, not a sync.

Report in a few lines: what changed, what you applied, what needs a human.
