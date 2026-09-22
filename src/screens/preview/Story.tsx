// FIGMA: 4844:12551 (Mobile) / 4875:3062 (Web) — "Your Raffles Story"
import { useState } from "react";
import { PostcardBack, PostcardFront } from "../../components/Postcard";
import {
  DownloadButton,
  Ground,
  StoryArrow,
  StoryDots,
  Wordmark,
} from "../../components/preview/chrome";
import { LetterSheet } from "../../components/preview/LetterSheet";
import { SealedCard } from "../../components/preview/SealedCard";
import { useDownloadPostcard, usePostcard, useViewport } from "../../lib/preview";

/** Picture side, then written side. The dots and the arrows both count these. */
const FACES = 2;

/**
 * What the recipient opens, years after the kiosk sent it.
 *
 * The same page at two sizes rather than two pages: the phone frame and the
 * web frame differ only in how much room the card is given and in what the
 * file leaves out of the narrow one. Where they genuinely disagree the
 * difference is a `lg:` — there is no second component tree to keep in step.
 */
export function Story() {
  const { postcard, pending } = usePostcard();
  const { card, compact } = useViewport();
  const download = useDownloadPostcard();

  const [revealed, setRevealed] = useState(false);
  const [face, setFace] = useState(0);
  const [reading, setReading] = useState(false);

  /*
   * The seal outlives the reveal. It is copied over the artwork and faded off
   * it, so the picture is uncovered rather than swapped in, and it is dropped
   * only once its own animation says it has finished — no timer to keep in
   * step with the duration in `index.css`.
   */
  const [sealed, setSealed] = useState(false);

  const reveal = () => {
    setRevealed(true);
    setSealed(true);
  };

  const turn = (by: number) => setFace((current) => (current + by + FACES) % FACES);

  return (
    <main className="relative flex min-h-dvh flex-col items-center px-[21px] pb-[32px] pt-[76px] lg:px-[48px]">
      <Ground />

      {/* Centred over the card on a phone, in the top-left corner on a laptop. */}
      <Wordmark className="absolute left-1/2 top-[26px] z-10 -translate-x-1/2 lg:left-[48px] lg:top-[55px] lg:translate-x-0" />

      {pending || !postcard ? null : !revealed ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-[19px]">
          {/* Settles onto the paper first; the card comes up under it. */}
          <h1 className="animate-beat-in max-w-[254px] text-center font-display text-[32px] italic leading-tight text-ink lg:max-w-none lg:text-[42px]">
            A postcard from your past has arrived.
          </h1>

          {/* Comes up from below the fold, as though it were being handed over. */}
          <SealedCard width={card} onReveal={reveal} className="animate-card-rise" />
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <h1 className="animate-story-in text-center font-display text-[32px] leading-tight text-ink lg:text-[64px]">
            Your Raffles Story
          </h1>

          {/* Only the mobile frames carry this line; the web frames drop it. */}
          <p className="animate-story-in mt-[40px] text-center text-[18px] font-light italic text-ink lg:hidden">
            Tap on the postcard to read
          </p>

          <div
            className="mt-[19px] grid grid-cols-2 place-items-center gap-x-[14px] gap-y-[28px] lg:mt-[23px] lg:grid-cols-[auto_auto_auto] lg:gap-x-[48px] lg:gap-y-0"
          >
            <div className="order-1 col-span-2 flex flex-col items-center gap-[26px] lg:order-2 lg:col-span-1">
              {/*
                On a phone the written side is 351px across and cannot be read,
                so tapping it opens the sheet. On a laptop it is read in place
                and the card is not a control at all.
              */}
              <div className="relative">
                {compact ? (
                  <button type="button" onClick={() => setReading(true)} className="block">
                    <Face postcard={postcard} face={face} width={card} />
                  </button>
                ) : (
                  <Face postcard={postcard} face={face} width={card} />
                )}

                {sealed && (
                  <div
                    className="animate-seal-lift pointer-events-none absolute inset-0"
                    onAnimationEnd={() => setSealed(false)}
                  >
                    <SealedCard width={card} />
                  </div>
                )}
              </div>

              <div className="animate-story-in lg:hidden">
                <StoryDots count={FACES} active={face} />
              </div>
            </div>

            <StoryArrow
              direction="left"
              label="Previous side"
              onClick={() => turn(-1)}
              className="animate-story-in order-2 justify-self-end lg:order-1 lg:justify-self-auto"
            />
            <StoryArrow
              direction="right"
              label="Next side"
              onClick={() => turn(1)}
              className="animate-story-in order-3 justify-self-start lg:order-3"
            />
          </div>

          <div className="animate-story-in mt-[60px] w-full lg:mt-[42px] lg:w-auto">
            <DownloadButton onClick={() => download.save(postcard)} busy={download.saving} />
          </div>
        </div>
      )}

      {reading && postcard && (
        <LetterSheet
          letter={postcard.letter}
          writtenOn={postcard.writtenOn}
          onClose={() => setReading(false)}
        />
      )}
    </main>
  );
}

function Face({
  postcard,
  face,
  width,
}: {
  postcard: NonNullable<ReturnType<typeof usePostcard>["postcard"]>;
  face: number;
  width: number;
}) {
  return face === 0 ? (
    <PostcardFront design={postcard.design} width={width} />
  ) : (
    <PostcardBack letter={postcard.letter} writtenOn={postcard.writtenOn} width={width} />
  );
}
