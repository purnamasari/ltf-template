# Frame registry and re-sync protocol

The Figma file:
[WIP / Raffles Heritage → Design](https://www.figma.com/design/HMYN8b4CKSRi2vwwSFznCS/WIP-_-Raffles-Heritage?node-id=3714-10662&m=dev)

## The registry

One row per frame that exists in code. `Synced` is the date the frame was last
read from Figma and reconciled with the screen; bump it in the same commit as
the change, so a later session can tell at a glance what has drifted.

| Route | Frame | Node id | Implemented in | Synced |
| --- | --- | --- | --- | --- |
| `/` | Cover / attract | `4734:6213` | `src/screens/Cover.tsx` | 2026-09-17 |
| `/intro` | Narration beat 1 | `4734:4631` | `src/screens/Narration.tsx` | 2026-09-17 |
| `/intro` | Narration beat 2 | `4929:5286` | `src/screens/Narration.tsx` | 2026-09-17 |
| `/intro` | Narration beat 3 | `4929:5308` | `src/screens/Narration.tsx` | 2026-09-17 |
| `/design` | Design picker | `4734:6117` | `src/screens/ChooseDesign.tsx` | 2026-09-17 |
| `/write` | Write, prompts open | `4734:6165` | `src/screens/Write.tsx` | 2026-09-17 |
| `/write` | Write, prompts folded | `4802:3536` | `src/screens/Write.tsx` | 2026-09-17 |
| `/preview` | Preview written side | `4802:3876` | `src/screens/Preview.tsx` | 2026-09-17 |
| `/name` | How to be addressed | `4808:4040` | `src/screens/YourName.tsx` | 2026-09-17 |
| `/delivery` | E-mail or Wechat | `4808:5417` | `src/screens/Delivery.tsx` | 2026-09-17 |
| `/confirm` | Confirmation summary | `4808:8058` | `src/screens/Confirmation.tsx` | 2026-09-17 |
| `/sending` | Posting the card | `4836:10970` | `src/screens/Sending.tsx` | 2026-09-17 |
| `/thank-you` | Thank You (8s timeout) | `4814:8120` | `src/screens/ThankYou.tsx` | 2026-09-17 |

### Deliberate departures from the file

Re-read these before "fixing" a screen to match Figma — they are decisions, not
drift, and a blind re-sync will undo them.

- **Canela → Cormorant Garamond.** Licensed face, not bundled. Headline widths
  and line breaks differ slightly from every frame. See `src/index.css`.
- **Privacy and Terms is not a step.** It is a dialog above the flow
  (`src/components/terms.tsx`), opened from the footer link on every screen.
- **The postbox on `/sending` is drawn in CSS** (`src/components/Postbox.tsx`) —
  the file has no postbox artwork.
- **Keyboard states in the frames are the iPadOS system keyboard.** Fields are
  ordinary `input`/`textarea`; nothing is drawn for it.
- **Two additions the frames do not draw:** the back chevron on narration beats
  2 and 3, and the "Tap to continue" line that fades in after typing.
- **The picture side of a postcard is flat artwork** exported at 595 × 420 with
  its caption and date baked in. The written side is composed at runtime.

## Why the protocol exists

A Figma MCP `get_code` call on a single dense frame can return tens of thousands
of tokens of generated markup — mostly absolutely-positioned divs and inline
hex. Pull two or three of those into a session that is also holding the
codebase and the backend work, and the useful context (the house conventions,
the seam rules, what you were actually doing) gets crowded out by material you
are going to throw away anyway. That is the failure mode, not the model.

The fix is to treat a Figma read as an **extraction step with its own session**,
whose only durable output is code and a registry row.

## The protocol

1. **One frame per session.** Run `/sync-frame <node-id>`. When it is done,
   `/clear` before the next frame.
2. **Cheapest tool that answers the question.**
   - `get_variable_defs` — tokens. Run this once per sync round, not per frame;
     the output belongs in `@theme`.
   - `get_metadata` — compact node tree with ids, names, positions and sizes.
     This answers most "what moved" questions on its own.
   - `get_image` — a render of the frame. Cheap, and often enough to confirm
     a layout change.
   - `get_code` — last resort, and only on the specific child node you are
     rewriting, never on a page or a whole flow.
3. **Never read a node you are not about to implement.** No "let me look at the
   whole file first". The registry above is the map.
4. **Land the change, then the registry row,** in one commit. The commit message
   names the node id.
5. **Design and backend never share a session.** Finish the frame, `/clear`,
   then do the API work. `src/lib/api.ts` is the seam; a design sync has no
   business there.
6. **If you need several frames in one sitting,** run each `/sync-frame` as a
   subagent. The Figma payload dies with the subagent; what comes back is a
   file list and a summary, which is all the parent session needed.

## When the backend arrives

`submitPostcard` in `src/lib/api.ts` is a stub. Point it at the real endpoint
and the Sending screen works unchanged. Keep it that way: request/response
shapes live in `src/lib/api.ts`, the draft shape lives in `src/lib/flow.tsx`,
and screens stay unaware of both. As long as that holds, a Figma re-sync can
never conflict with a backend change — they touch disjoint files.
