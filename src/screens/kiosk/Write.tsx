// FIGMA: 4734:6165, 4802:3536 — see docs/design/frames.md
import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { meta } from "../../lib/meta";
import { Backdrop } from "../../components/kiosk/Backdrop";
import { CloseButton, LogoMark, PrivacyLink, StepNav } from "../../components/kiosk/chrome";
import { ASSETS } from "../../lib/assets";
import { useFlow } from "../../lib/flow";
import { useIdleReset } from "../../lib/idle/useIdleReset";
import { IdleOverlay } from "../../components/kiosk/IdleOverlay";
import { useSwipe, wrapIndex } from "../../lib/useSwipe";

/**
 * The ruled writing area.
 *
 * The frame draws four 45px boxes with 44px between them, which averages
 * 44.57 — but a repeating gradient on a fractional period cannot land its rule
 * on a whole device pixel each time, so the gaps came out visibly uneven, some
 * 44 and some 45. A whole number renders evenly, and 45 is the box height the
 * frame actually draws; eight lines then run from 203 to 563 against the
 * frame's 247–559, which is within the alternation it was averaging.
 */
const LINE_HEIGHT = 45;
const LINES = 8;
const RULE_COLOR = "rgba(141, 110, 69, 0.65)";

/**
 * The cap drawn on the counter in `4802:3536` and `4991:3777`. The server
 * allows more, but it is the lower of the two that applies, so a tightened
 * server limit is honoured without touching the layout.
 */
const DESIGN_MAX_CHARACTERS = 600;

/** The prompt stack: centre, spacing and the two card sizes, from Figma. */
const PROMPT_CENTRE = { x: 897, y: 391.5 };
const PROMPT_STEP = 115;
const PROMPT_ACTIVE = { width: 400, height: 155 };
const PROMPT_RESTING = { width: 348, height: 135 };
const PROMPT_SLOTS = [-2, -1, 0, 1, 2];

const IDEA_PROMPTS = [
  "What is one moment from today you hope you’ll never forget?",
  "Where do you hope life has taken you one year from now?",
  "What is something you quietly wish for your future self?",
  "What would you like to remind your future self?",
  "What would make the year ahead truly meaningful to you?",
  "What would you tell yourself if you could speak to them one year from now?",
  "What do you hope your future self hasn’t forgotten?",
];

export function Write() {
  const MAX_CHARACTERS = Math.min(DESIGN_MAX_CHARACTERS, meta().max_body_chars);
  const navigate = useNavigate();
  const { draft, update } = useFlow();
  const [position, setPosition] = useState(1);
  const [showPrompts, setShowPrompts] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const idle = useIdleReset();

  const movePrompt = (delta: number) => setPosition((current) => current + delta);
  const promptSwipe = useSwipe({
    axis: "y",
    onNext: () => movePrompt(1),
    onPrevious: () => movePrompt(-1),
  });

  // Writing takes over the screen: the prompts fold away to the corner mark and
  // the ruled area opens up to full width.
  const startWriting = () => setShowPrompts(false);
  const reopenPrompts = () => {
    textareaRef.current?.blur();
    setShowPrompts(true);
  };

  return (
    <>
      <Backdrop />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[70px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[40px] font-[100] leading-normal text-ink">
        What would you like to convey to your future self?
      </h1>

      {!showPrompts && (
        <p className="absolute left-[108px] top-[174px] whitespace-nowrap text-[18px] text-ink opacity-33">
          {draft.letter.length}/{MAX_CHARACTERS} characters
        </p>
      )}

      {/*
        The rules are eight elements, not a repeating gradient. A repeating
        gradient is rasterised as one tile and stepped, so the rule lands on a
        different sub-pixel each repeat and the gaps read as uneven — which is
        what they did. Positioned individually, every rule is placed and
        antialiased the same way, at any stage scale.
      */}
      <div
        className="absolute left-[108px] top-[203px] transition-[width] duration-[400ms] ease-out"
        style={{ width: showPrompts ? 494 : 944, height: LINE_HEIGHT * LINES }}
      >
        <div aria-hidden className="absolute inset-0">
          {Array.from({ length: LINES }, (_, line) => (
            <div
              key={line}
              className="absolute inset-x-0 h-px"
              style={{ top: (line + 1) * LINE_HEIGHT - 1, backgroundColor: RULE_COLOR }}
            />
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={draft.letter}
          onChange={(event) => update({ letter: event.target.value })}
          onFocus={startWriting}
          placeholder="Start writing"
          maxLength={MAX_CHARACTERS}
          spellCheck={false}
          className="no-scrollbar absolute inset-0 h-full w-full resize-none bg-transparent text-[20px] text-ink outline-none placeholder:italic placeholder:text-[#423418] placeholder:opacity-25"
          style={{ lineHeight: `${LINE_HEIGHT}px` }}
        />
      </div>

      {showPrompts ? (
        <>
          <p className="absolute left-[900px] top-[175px] -translate-x-1/2 whitespace-nowrap text-[18px] text-ink-soft">
            Idea Prompts
          </p>

          <div {...promptSwipe} className="absolute left-[660px] top-[190px] h-[400px] w-[480px]">
            {PROMPT_SLOTS.map((offset) => {
              const slot = position + offset;
              const prompt = IDEA_PROMPTS[wrapIndex(slot, IDEA_PROMPTS.length)];
              const distance = Math.abs(offset);
              const isActive = offset === 0;
              const size = isActive ? PROMPT_ACTIVE : PROMPT_RESTING;

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => movePrompt(offset)}
                  disabled={isActive}
                  aria-current={isActive}
                  className={`absolute grid place-items-center rounded-[19px] px-[40px] text-center text-[20px] leading-normal transition-[transform,width,height,opacity] duration-[400ms] ease-out shadow-[0px_3px_2.1px_0px_rgba(0,0,0,0.07),inset_0px_1px_10.3px_0px_rgba(175,145,105,0.18)] ${
                    isActive ? "bg-cream text-ink" : "bg-[#d7bea2] text-black"
                  }`}
                  style={{
                    // Positioned against the panel box, not the screen.
                    left: PROMPT_CENTRE.x - 660,
                    top: PROMPT_CENTRE.y - 190,
                    width: size.width,
                    height: size.height,
                    transform: `translate(-50%, calc(-50% + ${offset * PROMPT_STEP}px))`,
                    opacity: distance >= 2 ? 0 : isActive ? 1 : 0.27,
                    // The selected card sits over its neighbours.
                    zIndex: 10 - distance,
                    pointerEvents: distance >= 2 ? "none" : undefined,
                  }}
                >
                  {prompt}
                </button>
              );
            })}
          </div>

          <img
            src={ASSETS.scrollHand}
            alt=""
            aria-hidden
            className="absolute left-[1051px] top-[368px] z-20 block h-[55px] w-[45px] max-w-none"
          />

          <div
            aria-hidden
            className="absolute left-[1110px] top-[364px] z-20 flex flex-col items-center gap-[9.87px]"
          >
            {IDEA_PROMPTS.map((prompt, index) => (
              <span
                key={prompt}
                className="size-[6px] rounded-full"
                style={{
                  backgroundColor:
                    index === wrapIndex(position, IDEA_PROMPTS.length)
                      ? "#523F29"
                      : "rgba(175, 145, 105, 0.5)",
                }}
              />
            ))}
          </div>

          <CloseButton
            label="Hide idea prompts"
            onClick={() => setShowPrompts(false)}
            className="z-20 left-[1074px] top-[156px]"
          />
        </>
      ) : (
        <button
          type="button"
          onClick={reopenPrompts}
          className="absolute left-[1103px] top-[53px] w-[57px] text-center text-[15px] font-light leading-normal text-forest"
        >
          <img
            src={ASSETS.promptsStack}
            alt=""
            aria-hidden
            className="mx-auto block h-[49.46px] w-[42px] max-w-none"
          />
          Idea Prompts
        </button>
      )}

      <StepNav
        onBack={() => navigate({ to: "/design" })}
        onNext={() => navigate({ to: "/preview" })}
        nextDisabled={draft.letter.trim().length === 0}
        backLabel="Choose Design"
        nextLabel="Preview"
      />

      <PrivacyLink />

      {idle.asking && <IdleOverlay elapsed={idle.elapsed} onDismiss={idle.keepGoing} />}
    </>
  );
}
