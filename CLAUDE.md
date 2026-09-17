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
6. Every screen file carries a `FIGMA:` header comment with its node id. Keep it
   accurate; `docs/design/frames.md` is generated from those.

## Working with the Figma MCP

`.mcp.json` points at Figma Desktop's Dev Mode MCP server
(`http://127.0.0.1:3845/mcp`) — open the file in Figma Desktop and enable the
Dev Mode MCP server under Preferences for the tools to appear.

Re-syncing a screen is one frame at a time, in its own session: use
`/sync-frame <node-id>`. The rationale and the rest of the protocol are in
[docs/design/frames.md](docs/design/frames.md). The short version:

- Never call a Figma tool on the whole page or on a node you are not about to
  implement. `get_metadata` (a compact tree) before `get_code` (very large).
- One frame per session. `/clear` between frames, and between a design pass and
  a backend pass.
- What is worth keeping from a sync goes into `docs/design/frames.md` or the
  code itself, not into the conversation.
