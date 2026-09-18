// FIGMA: 4734:4631, 4929:5286, 4929:5308 — see docs/design/frames.md
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { IntroScene } from "../components/IntroScene";
import { CarouselArrow, PrivacyLink } from "../components/chrome";
import { ASSETS } from "../lib/assets";
import { useFadeIn } from "../lib/useFadeIn";

/**
 * Three beats of narration on the same cover layout. Each one fades up into
 * place; a tap finishes the fade, and the next tap moves on.
 */
const BEATS = [
  "Every guest arrives with a story. Some celebrating a milestone, others beginning a new chapter, or simply stepping away from the rhythm of everyday life.",
  "Take a moment to reflect. Capture a thought, a promise, or a memory of who you are right now, and preserve it within this letter.",
  "One year from now, your message will find its way back to you, reminding you not only of where you were, but of who you hoped to become.",
];

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
      <IntroScene progress={45 / 1193}>
        <img
          src={ASSETS.introGlow}
          alt=""
          aria-hidden
          className="absolute left-1/2 max-w-none -translate-x-1/2"
          style={
            isLast
              ? { top: 348, width: 988, height: 191 }
              : { top: 347, width: 988, height: 215 }
          }
        />
        {/*
          The line rises a few pixels as it arrives, which reads as settling onto
          the paper rather than switching on. Keyed on the beat so the animation
          restarts; dropping the class on a tap ends it at once, since the base
          styles are the animation's final values.
        */}
        <p
          key={beat}
          aria-live="polite"
          onAnimationEnd={settle}
          className={`absolute left-1/2 w-[848px] -translate-x-1/2 text-center text-[24px] leading-normal text-ink ${
            settled ? "" : "animate-beat-in"
          }`}
          style={{ top: isLast ? 414 : 419 }}
        >
          {BEATS[beat]}
        </p>

        {!isLast && (
          <p
            className={`absolute left-1/2 top-[597px] -translate-x-1/2 whitespace-nowrap text-[20px] font-light italic text-ink transition-opacity duration-500 ${
              settled ? "opacity-100" : "opacity-0"
            }`}
          >
            Tap to continue
          </p>
        )}
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

      {isLast && (
        <button
          type="button"
          onClick={() => navigate({ to: "/design" })}
          className="absolute left-[466px] top-[603px] z-20 h-[53px] w-[253px] rounded-[48px] bg-forest-dark text-[20px] text-on-forest"
        >
          Start Writing
        </button>
      )}

      <PrivacyLink tone="gold" className="z-20 left-[59px] top-[782px]" />
    </>
  );
}
