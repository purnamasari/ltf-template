# raffles-ltf — Postcard to the Future

iPad kiosk (1194 × 834 landscape) built from the WIP / Raffles Heritage Figma
file. Vite + React 19 + TypeScript, Tailwind v4, TanStack Router + Query.

`npm run dev` · `npm run build` (tsc -b + vite build) · `npm run lint` (oxlint).

## Layout of the code

- `src/screens/*` — one file per route, each one a Figma frame.
- `src/components/*` — shared pieces (`Stage` scales the fixed 1194 × 834 frame
  to the viewport; `chrome.tsx` is the footer/progress that sits on every screen).
- `src/lib/*` — `flow.tsx` (session draft), `api.ts` (the backend seam),
  `designs.ts`, `assets.ts` (the single registry of exported artwork paths).
- `src/index.css` — `@theme` tokens: colours, fonts, stage size.

## Two seams, kept apart

The point of the layout above is that a design change and a backend change
never need to be open at the same time:

- **Design edits** touch `src/screens`, `src/components`, `src/index.css`,
  `public/assets`. They must not reach into `src/lib/api.ts`.
- **Backend edits** touch `src/lib/api.ts`, `src/lib/flow.tsx` types and the
  React Query call sites. They must not restyle a screen.

If a task seems to need both, do them as two passes, in that order.

## Where functional code goes

A screen is a Figma frame. It gets re-synced from a file other people edit, so
**a screen may hold layout and local UI state, and nothing else**: no fetch, no
storage, no retry, no business rule, no decision about where the guest goes
next. Everything durable lives under `src/lib/<domain>/` and is reached through
a single hook, so a frame can move without a line of logic being at risk.

`src/lib/submission/` is the worked example. The Sending screen renders a
postcard going into a box and reads one flag:

```tsx
const { failed } = useSubmitPostcard();
```

When it is time to send, `mutate` on mount, the navigate-on-success and the
error shape are the hook's business. Re-syncing `4836:10970` cannot break any of
it, because none of it is in the file being rewritten.

The features not yet built go the same way, one folder each:

| Domain | Folder | Public surface |
| --- | --- | --- |
| Handing the postcard over | `src/lib/submission/` | `useSubmitPostcard()` |
| Queue and retry when the kiosk is offline | `src/lib/outbox/` | `useOutbox()` |
| Pairing and reporting to the dashboard | `src/lib/pairing/` | `usePairing()` |
| Service worker and the update policy | `src/lib/updates/` | `useApplyUpdateWhenIdle()` |

Two things stay out of this rule, because they genuinely belong to the layout:

- **Interaction primitives** — `useSwipe`, `useTypewriter`. Behaviour, but
  behaviour the design specifies; they live in `src/lib` and screens call them.
- **Geometry** — `MOUTH_Y` in `Sending.tsx` derived from the postbox's own
  `slotTop`, the carousel offsets. These must move when the frame moves, so
  they belong beside the layout, not behind a hook.

## Rules that survive a re-sync from Figma

1. **Tokens, never raw values.** Colour, font and size go into `@theme` in
   `src/index.css` and are used as `bg-parchment`, `text-ink`, `font-display`.
   A hex literal in a screen file is a bug, even if Figma's codegen emitted it.
2. **Positions come from the 1194 × 834 frame** and are written as plain
   absolute values. There are no responsive breakpoints; `Stage` handles fit.
3. **Artwork goes through `src/lib/assets.ts`.** Export to `public/assets`,
   downscale for the kiosk, register the path there — never inline base64 or a
   Figma URL.
4. **Don't paste Figma codegen.** Read the frame, then write the screen in the
   house idiom. Generated absolutely-positioned divs are rejected on review.
5. **Canela is licensed and not bundled** — headings fall back to Cormorant
   Garamond, so line breaks may differ slightly from the frames. Not a bug.
6. `docs/design/frames.json` is the registry and the source of truth; the table
   in `frames.md` is generated from it (`node scripts/frames.mjs table`). Screen
   files carry a `FIGMA:` header comment as a convenience — the registry wins if
   the two disagree.

## Working with the Figma MCP

`.mcp.json` points at Figma Desktop's Dev Mode MCP server
(`http://127.0.0.1:3845/mcp`) — open the file in Figma Desktop and enable the
Dev Mode MCP server under Preferences for the tools to appear.

The design team duplicates and replaces frames, so **frame ids are a cache,
not a key**. The only id this project trusts is the parent section
(`parent.nodeId` in `docs/design/frames.json`); `/scan-frames` re-resolves every
frame id from it by name and canvas position.

- `/scan-frames` — one `get_metadata` call on the parent, then a script prints
  what moved, what is new and what is gone. No frame contents are read.
- `/sync-frame <route-or-key>` — reconcile one screen. Takes a route, not a node
  id; the registry resolves the id.

The rationale and the rest of the protocol are in
[docs/design/frames.md](docs/design/frames.md). The short version:

- `get_metadata` (a compact tree) before `get_code` (very large), and never
  `get_code` on a whole frame when a child node will do.
- The only page-level read is `/scan-frames`, and its output goes to a file on
  disk, never into the conversation.
- A new frame is a new screen — a route, a screen file, a step in the progress
  chrome — and a product decision. Not something a sync does quietly.
- One frame per session. `/clear` between frames, and between a design pass and
  a backend pass.
- What is worth keeping from a sync goes into `docs/design/frames.md` or the
  code itself, not into the conversation.
