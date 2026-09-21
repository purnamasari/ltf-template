// FIGMA: 4734:6117 — see docs/design/frames.md
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Backdrop } from "../components/Backdrop";
import { CarouselArrow, Dots, LogoMark, PrivacyLink, ProgressBar, StepNav } from "../components/chrome";
import { PostcardFront } from "../components/Postcard";
import { POSTCARD_DESIGNS } from "../lib/designs";
import { useFlow } from "../lib/flow";
import { useSwipe, wrapIndex } from "../lib/useSwipe";

/** Centre of the carousel and the gap between neighbouring cards, from Figma. */
const CENTRE_X = 597.5;
const CENTRE_Y = 345.5;
const STEP = 146;
const ACTIVE = { width: 503, height: 355 };
const RESTING = { width: 387, height: 273 };

/**
 * Slots either side of the selected design. The outermost pair is mounted
 * invisible so a card never pops into view when the carousel moves.
 */
const SLOTS = [-2, -1, 0, 1, 2];

export function ChooseDesign() {
  const navigate = useNavigate();
  const { draft, update } = useFlow();

  // Counts up and down without wrapping, so a move is always one step in one
  // direction and the card that was next keeps its identity while it animates.
  const [position, setPosition] = useState(() =>
    Math.max(0, POSTCARD_DESIGNS.findIndex((design) => design.id === draft.designId)),
  );

  const go = (delta: number) => {
    const next = position + delta;
    setPosition(next);
    update({ designId: POSTCARD_DESIGNS[wrapIndex(next, POSTCARD_DESIGNS.length)].id });
  };

  const swipe = useSwipe({ axis: "x", onNext: () => go(1), onPrevious: () => go(-1) });
  const selected = POSTCARD_DESIGNS[wrapIndex(position, POSTCARD_DESIGNS.length)];

  return (
    <>
      <Backdrop />
      <ProgressBar step="design" />
      <LogoMark className="left-[52px] top-[58px]" />

      {/* The frame writes this as "Hi [Name], …" — the name is the one the
          guest gave on the step before. */}
      <h1 className="absolute left-1/2 top-[45px] w-[725px] -translate-x-1/2 text-center font-display text-[40px] font-light leading-[48px] text-ink">
        Hi {draft.name.trim() || "there"},
        <br />
        please pick a postcard that resonates with you
      </h1>

      <div {...swipe} className="absolute inset-x-0 top-[150px] h-[400px]">
        {SLOTS.map((offset) => {
          const slot = position + offset;
          const design = POSTCARD_DESIGNS[wrapIndex(slot, POSTCARD_DESIGNS.length)];
          const distance = Math.abs(offset);
          const size = offset === 0 ? ACTIVE : RESTING;

          return (
            <button
              key={slot}
              type="button"
              onClick={() => go(offset)}
              disabled={offset === 0}
              aria-label={design.title}
              aria-current={offset === 0}
              className="absolute transition-[transform,width,height,opacity] duration-[450ms] ease-out"
              style={{
                left: CENTRE_X,
                top: CENTRE_Y - 150,
                width: size.width,
                height: size.height,
                transform: `translate(calc(-50% + ${offset * STEP}px), -50%)`,
                opacity: distance >= 2 ? 0 : offset === 0 ? 1 : 0.52,
                zIndex: 10 - distance,
                pointerEvents: distance >= 2 ? "none" : undefined,
              }}
            >
              <PostcardFront design={design} fill />
            </button>
          );
        })}
      </div>

      <CarouselArrow
        direction="left"
        onClick={() => go(-1)}
        label="Previous design"
        className="z-20 left-[74px] top-[353px]"
      />
      <CarouselArrow
        direction="right"
        onClick={() => go(1)}
        label="Next design"
        className="z-20 left-[1074px] top-[353px]"
      />

      <Dots
        count={POSTCARD_DESIGNS.length}
        active={wrapIndex(position, POSTCARD_DESIGNS.length)}
        className="left-1/2 top-[540px] -translate-x-1/2"
      />

      <p
        key={selected.id}
        className="absolute left-1/2 top-[594px] w-[583px] -translate-x-1/2 animate-caption-in text-center text-[20px] italic leading-[1.2] text-ink"
      >
        {selected.caption}
      </p>

      <StepNav
        onBack={() => navigate({ to: "/name" })}
        onNext={() => navigate({ to: "/write" })}
        nextLabel="Select"
      />

      <PrivacyLink />
    </>
  );
}
