// FIGMA: 4734:4631, 4929:5286, 4929:5308 — see docs/design/frames.md
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { IntroScene } from "../components/IntroScene";
import { CarouselArrow, Dots, PillButton, PrivacyLink } from "../components/chrome";
import { ASSETS } from "../lib/assets";
import { useFadeIn } from "../lib/useFadeIn";

/**
 * Three beats of narration on the same cover layout. Each one fades up into
 * place; a tap finishes the fade, and the next tap moves on.
 */
const BEATS = [
  "Every guest arrives with a story. Some are celebrating a milestone, others beginning a new chapter, or simply stepping away from the rhythm of everyday life.",
  "Take a moment to reflect. Capture a thought, a promise, or a memory of who you are right now and preserve it within this letter.",
  "One year from now, your message will remind you not only of where you were, but of who you hoped to become.",
];

/**
 * The card the line sits on. The beats run to two or three lines, so the text
 * is centred in the card rather than pinned to a top — which is what the frames
 * do by hand, nudging the paragraph down as it gets shorter.
 */
const CARD = { left: 112, top: 326, width: 974, height: 203 };

export function Narration() {
  const navigate = useNavigate();
  const { beat: initialBeat } = useSearch({ from: "/intro" });
  const [beat, setBeat] = useState(initialBeat);
  const { settled, settle } = useFadeIn(beat);

  const isLast = beat === BEATS.length - 1;

  const advance = () => {
    if (!settled) {
      settle();
      return;
    }
    if (!isLast) setBeat((current) => current + 1);
  };

  return (
    <>
      <IntroScene step="intro">
        <img
          src={ASSETS.introGlow}
          alt=""
          aria-hidden
          className="absolute left-1/2 max-w-none -translate-x-1/2"
          style={{ top: 320, width: 988, height: 215 }}
        />
        <div
          aria-hidden
          className="absolute border border-gold/45 bg-cream"
          style={CARD}
        />
        {/*
          The line rises a few pixels as it arrives, which reads as settling onto
          the paper rather than switching on. Keyed on the beat so the animation
          restarts; dropping the class on a tap ends it at once, since the base
          styles are the animation's final values.
        */}
        <div
          className="absolute grid place-items-center"
          style={{ left: CARD.left, top: CARD.top, width: CARD.width, height: CARD.height }}
        >
          <p
            key={beat}
            aria-live="polite"
            onAnimationEnd={settle}
            className={`w-[848px] text-center text-[24px] leading-normal text-ink ${
              settled ? "" : "animate-beat-in"
            }`}
          >
            {BEATS[beat]}
          </p>
        </div>

        <Dots count={BEATS.length} active={beat} className="left-1/2 top-[549px] -translate-x-1/2" />
      </IntroScene>

      {/* Tap anywhere: finish the line, then move to the next beat. */}
      <button
        type="button"
        onClick={advance}
        aria-label={settled ? "Continue" : "Show the whole line"}
        className="absolute inset-0 z-10 cursor-pointer"
      />

      {beat > 0 && (
        <CarouselArrow
          direction="left"
          onClick={() => setBeat((current) => current - 1)}
          label="Previous"
          className="z-20 left-[74px] top-[394px]"
        />
      )}

      {/* Present from the first beat, but only live on the last: the frames draw
          it greyed until the narration has been read through. */}
      <PillButton
        className="z-20 left-[471px] top-[595px]"
        variant={isLast ? "primary" : "secondary"}
        disabled={!isLast}
        onClick={() => navigate({ to: "/name" })}
      >
        Start Writing
      </PillButton>

      <PrivacyLink tone="gold" className="z-20 left-[59px] top-[782px]" />
    </>
  );
}
