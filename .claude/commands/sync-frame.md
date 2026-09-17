---
description: Re-sync one Figma frame into its screen, reading only that node
argument-hint: <route-or-key> [what changed]
---

Re-sync the frame behind `$1` into this codebase. Extra context from the user
about what changed: $2

`$1` is a route (`/delivery`) or a registry key (`delivery`) — not a raw node id.
Ids change when a designer duplicates and replaces a frame, so the registry is
what resolves them. Work in this order and do not widen the scope.

1. Read `docs/design/frames.json`, find the entry whose `route` or `key` matches
   `$1`, and take its **current** `nodeId`, `file` and `key`. If `$1` matches
   nothing, stop and say so — run `/scan-frames` first rather than guessing an id.
   If the entry's `synced` date is older than the last scan, expect drift.
2. Read `docs/design/frames.md` → "Deliberate departures from the file". A
   difference listed there is a decision, not drift, and must not be "fixed".
3. Read the implementation file named in the entry, and anything it imports that
   you are actually going to change. Nothing else.
4. Pull from Figma, cheapest tool first, stopping as soon as you can answer the
   question. Never call a Figma tool on a node outside this frame.
   - `get_metadata` on the frame's node id. Save it to
     `docs/design/snapshots/<key>.json.new`, then
     `diff docs/design/snapshots/<key>.json docs/design/snapshots/<key>.json.new`
     — if a snapshot exists, that diff is what you read, not the whole tree. No
     snapshot yet (first sync since this was set up) means reading the tree once;
     it becomes the baseline.
   - `get_image` on the frame if you need to see it.
   - `get_variable_defs` only if a token looks new — the result goes into
     `@theme` in `src/index.css`, never inline into a screen.
   - `get_code` only on the specific child node being rewritten, never on the
     whole frame if a smaller node will do. Reference, not output: write the
     screen in the house idiom from CLAUDE.md.
5. Make the change. Tokens not hex, `src/lib/assets.ts` for any new artwork, no
   responsive rules, and nothing under `src/lib/` edited at all — a sync changes
   layout, never behaviour.

   If the frame has dropped an element that the screen uses to drive something
   (a button wired to a hook, a field the flow stores), do **not** delete the
   wiring to make the markup match. Say what the design removed and what it was
   connected to, and let the user decide. A frame going quiet about a feature is
   usually the designer not having drawn it, not the feature being cancelled.
6. Verify: `npm run build` and `npm run lint` must both pass.
7. Move `<key>.json.new` over `<key>.json` — the snapshot is now the baseline for
   next time. Update the entry's `synced` date in `docs/design/frames.json` and
   run `node scripts/frames.mjs table`. If the sync produced a new deliberate
   departure, add it to that section of `frames.md`.
8. Commit with the route and node id in the subject, e.g.
   `Re-sync /write from 4802:3536`.

Report back in a few lines: what actually differed, what you changed, and
anything you deliberately left alone. Do not paste Figma output into the report —
the code, the snapshot and the registry are the record.
