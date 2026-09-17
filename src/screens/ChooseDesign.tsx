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
const CENTRE_X = 591.5;
const CENTRE_Y = 378.5;
const STEP = 160;
const ACTIVE = { width: 617, height: 435 };
const RESTING = { width: 515, height: 363 };

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

  return (
    <>
      <Backdrop />
      <ProgressBar value={139 / 1193} />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[70px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[40px] font-light leading-normal text-ink">
        Pick a postcard design that resonates with you
      </h1>

      <div {...swipe} className="absolute inset-x-0 top-[140px] h-[460px]">
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
                top: CENTRE_Y - 140,
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
        className="z-20 left-[74px] top-[355px]"
      />
      <CarouselArrow
        direction="right"
        onClick={() => go(1)}
        label="Next design"
        className="z-20 left-[1074px] top-[355px]"
      />

      <Dots
        count={POSTCARD_DESIGNS.length}
        active={wrapIndex(position, POSTCARD_DESIGNS.length)}
        className="left-1/2 top-[622px] -translate-x-1/2"
      />

      <StepNav
        onBack={() => navigate({ to: "/intro", search: { beat: 2 } })}
        onNext={() => navigate({ to: "/write" })}
      />

      <PrivacyLink />
    </>
  );
}
