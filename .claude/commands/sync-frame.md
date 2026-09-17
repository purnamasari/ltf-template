---
description: Re-sync one Figma frame into its screen, reading only that node
argument-hint: <node-id> [what changed]
---

Re-sync the Figma frame `$1` into this codebase. Extra context from the user
about what changed: $2

Work in this order and do not widen the scope.

1. Read `docs/design/frames.md` and find the row for `$1` — it names the file
   that implements the frame and the date it was last synced. Also read the
   "Deliberate departures from the file" section: a difference listed there is
   a decision, not drift, and must not be "fixed".
2. Read only that implementation file (and anything it imports that you are
   actually going to change).
3. Pull from Figma, cheapest tool first, and stop as soon as you can answer the
   question:
   - `get_metadata` on `$1` — the compact tree. Compare positions, sizes and
     names against the code. This alone settles most syncs.
   - `get_image` on `$1` if you need to see it.
   - `get_variable_defs` only if a token looks new — the result goes into
     `@theme` in `src/index.css`, never inline into a screen.
   - `get_code` only on the specific child node you are rewriting, never on
     `$1` as a whole if a smaller node will do. Use it as reference, not as
     output: write the screen in the house idiom described in CLAUDE.md.
   Never call any Figma tool on a node outside this frame.
4. Make the change. Tokens not hex, `src/lib/assets.ts` for any new artwork,
   no responsive rules, no edits to `src/lib/api.ts`.
5. Verify: `npm run build` and `npm run lint` must both pass.
6. Update the frame's `Synced` date in `docs/design/frames.md`. If the sync
   produced a new deliberate departure, add it to that section.
7. Commit with the node id in the subject, e.g. `Re-sync /write from 4802:3536`.

Report back in a few lines: what actually differed, what you changed, and
anything you deliberately left alone. Do not paste Figma output into the
report — the code and the registry are the record.
