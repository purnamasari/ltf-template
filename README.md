# Postcard to the Future — Raffles Heritage kiosk

An iPad kiosk flow that invites a guest at Raffles Singapore to write a postcard
to themselves, choose an archival design, and have it delivered one year later.

Implemented from Figma:
[WIP / Raffles Heritage → Design](https://www.figma.com/design/HMYN8b4CKSRi2vwwSFznCS/WIP-_-Raffles-Heritage?node-id=3714-10662&m=dev).

## Running it

```bash
npm install
npm run dev
```

`npm run build` type-checks and bundles; `npm run lint` runs oxlint.

## How it is put together

- **Vite + React 19 + TypeScript**, Tailwind v4 (`@tailwindcss/vite`), TanStack
  Router for the screen sequence and TanStack Query for the submit mutation.
- The design is drawn at a fixed **1194 × 834** (iPad Pro 11" landscape), which
  is the kiosk's native resolution. `Stage` scales that frame to fit whatever
  viewport it lands in, so every position taken from Figma stays exact and no
  screen needs responsive rules.
- Colours, fonts and the stage size live as tokens in `src/index.css`
  (`@theme`), so screens use `bg-parchment`, `text-ink`, `font-display` rather
  than raw hex.
- **Privacy and Terms is not a step.** The dialog (`src/components/terms.tsx`)
  is mounted above the whole flow and opens from the footer link that sits on
  every screen; the tick is remembered for the session.
- `src/lib/flow.tsx` holds the in-progress postcard (design, letter, name,
  delivery channel and contact) for the length of one session and clears it when
  the Thank You screen times out.

### The opening

A guest walks up to the cover (`/`) and taps **Discover More**. The narration
(`/intro`) then plays three lines on the same layout, each typed out a character
at a time: a tap completes the line in progress, the next tap moves to the
following beat, and the third ends on **Start Writing**. Beats two and three
carry a back chevron, and `/intro?beat=2` returns to the last line so stepping
back from the design picker does not replay the whole sequence.

### Carousels

The design picker, the idea prompts and the confirmation cards all animate
between states and respond to a swipe as well as the arrows
([`useSwipe`](src/lib/useSwipe.ts)). Each carousel keeps a position that counts
up and down without wrapping, so a card that moves from "next" to "selected"
keeps its identity and animates rather than being swapped out; the design it
shows is the position wrapped into the list. A slot is mounted just off each end
at zero opacity so nothing pops into view mid-move.

### Writing

The ruled area starts beside the idea prompts. As soon as the guest taps into it
the prompts fold away to the mark in the top-right corner, the rules open up to
full width and the character counter appears — the state drawn in `4802:3536`.
Tapping that corner mark brings the prompts back. The letter is capped at **512
characters**; the frame reads "436/600 characters", so if 600 is the number you
want, change `MAX_CHARACTERS` in [`Write.tsx`](src/screens/Write.tsx).

### Screens

| Route | Screen | Figma node |
| --- | --- | --- |
| `/` | Cover / attract | `4734:6213` |
| `/intro` | Three beats of narration, typed out | `4734:4631`, `4929:5286`, `4929:5308` |
| `/design` | Pick a postcard design | `4734:6117` |
| `/write` | Write the letter, with idea prompts | `4734:6165`, `4802:3536` |
| `/preview` | Preview the written side | `4802:3876` |
| `/name` | How would you like to be addressed? | `4808:4040` |
| `/delivery` | E-mail or Wechat | `4808:5417` |
| `/confirm` | Confirmation summary | `4808:8058` |
| `/sending` | Posting the card | `4836:10970` |
| `/thank-you` | Thank You, auto-returns after 8s | `4814:8120` |

## Notes and open items

- **Beth Ellen** (Google Fonts) is bundled for the "Raffles Heritage" script
  watermark on the cover, as in the frame.
- **Canela is not bundled.** The display face in the design is Canela
  (Commercial Type, licensed and not redistributable), so headings currently
  render in Cormorant Garamond — close in proportion, not identical, so headline
  line breaks may shift slightly from the Figma frames. To use the real face,
  drop `Canela-Thin.woff2`, `Canela-ThinItalic.woff2` and `Canela-Light.woff2`
  into `public/fonts` and uncomment the `@font-face` block in `src/index.css`;
  `"Canela"` is already first in `--font-display`.
- **The picture side of a postcard is a finished artwork**, exported from Figma
  at 595 × 420 with its caption and date baked in — including `01/09/2026`. Two
  designs ship in `src/lib/designs.ts`; the carousel handles any number. Making
  the printed date dynamic needs the artwork split into photo + type layers.
- **The written side is composed at runtime** (`src/components/Postcard.tsx`)
  from the guest's text, the exported stamp, the Raffles mark and today's date,
  because the letter has to be the guest's own.
- **On-screen keyboard.** The Figma frames include iPadOS keyboard states; those
  are the system keyboard, so the fields here are ordinary `input`/`textarea`
  elements and the OS provides it. Nothing is drawn for it in code.
- **`submitPostcard` in `src/lib/api.ts` is a stub** that resolves after a short
  delay. Point it at the real delivery endpoint and the Sending screen works
  unchanged.
- **The postbox on `/sending` is drawn in CSS**
  ([`Postbox.tsx`](src/components/Postbox.tsx)) — the Figma file has no postbox
  artwork, so it is built from plain shapes in the house palette. The card lifts
  towards the viewer in 3D, squares up over the slot and then slides straight
  down into it: the frame around the card is clipped at the mouth, so the card
  is cut off at the slot line and goes in edge first rather than passing behind
  the box. `MOUTH_Y` in [`Sending.tsx`](src/screens/Sending.tsx) is derived from
  the box's own `slotTop`, so moving or resizing the box keeps the two in step.
  Drop in an exported illustration and the animation is unchanged.
- **`/preview` shows only the written side**, centred. The guest is checking
  their own words there; the picture side is still reviewable on `/confirm`.
- **Two additions the frames do not draw.** The back chevron on narration beats
  two and three uses the same exported chevron as the carousels, and the "Tap to
  continue" line fades in once a beat has finished typing. Say the word if you
  would rather they behaved differently.
- The cover sets its title as four placed words in the display face rather than
  the flattened wordmark used on the narration frames, matching `4734:6213`.
  Substituting Cormorant for Canela shifts those word widths slightly.
- Progress-bar widths are taken from the filled track in each frame.

## Assets

`public/assets` holds the artwork exported from the Figma file — backgrounds,
the Raffles mark, arrows, the stamp and the postcard designs. Large backgrounds
were downscaled and recompressed for the kiosk (the set is ~2.6 MB total).
`src/lib/assets.ts` is the single registry of those paths.
