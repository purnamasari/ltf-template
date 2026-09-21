// FIGMA: 4836:10970 — see docs/design/frames.md
import { Backdrop } from "../components/Backdrop";
import { LogoMark, ProgressBar } from "../components/chrome";
import { PostcardFront } from "../components/Postcard";
import { ASSETS } from "../lib/assets";
import { useSealPostcard } from "../lib/outbox/useSealPostcard";
import { useSelectedDesign } from "../lib/flow";

/**
 * The only refusals a guest can see. Everything else is either retried in the
 * background or a bug that has no business being on a kiosk screen.
 */
const REJECTION: Record<string, string> = {
  "letter.recipient_already_used":
    "This address already has a postcard on its way. Only one may be sent to each address.",
};

const FALLBACK_REJECTION =
  "We could not send your postcard just now. Please ask a member of staff for help.";

/**
 * The postbox photograph, placed as the frame places it: a 503 x 996 window on
 * an image drawn larger than the window and offset behind it.
 */
const BOX = { left: 346, top: 143, width: 503, height: 996 };
const PHOTO = { left: -277, top: -355, width: 1037, height: 1553 };

/**
 * The posting slot on the top face, measured off the photograph: centre
 * (588, 276) in frame coordinates, 147px wide. The card is drawn at 452 and
 * ends at 30% of that — 136px — so it is narrower than the slot it goes into.
 */
const SLOT = { x: 588, y: 276 };
const CARD_WIDTH = 452;

/** Everything from the slot line down, as a clip inset from the bottom. */
const BELOW_SLOT = 834 - SLOT.y;

/**
 * The postcard is handed over while it is posted on screen, so the guest
 * watches it go rather than watching a spinner.
 */
export function Sending() {
  const design = useSelectedDesign();
  const { rejected } = useSealPostcard();

  return (
    <>
      <Backdrop />
      <ProgressBar step="sending" />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[70px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[40px] font-[100] leading-normal text-ink">
        Delivering your postcard to the future...
      </h1>

      <div
        aria-hidden
        className="absolute overflow-hidden animate-[postbox-receive_2.4s_ease-out_forwards]"
        style={{ left: BOX.left, top: BOX.top, width: BOX.width, height: BOX.height }}
      >
        <img
          src={ASSETS.postbox}
          alt=""
          className="absolute max-w-none"
          style={{ left: PHOTO.left, top: PHOTO.top, width: PHOTO.width, height: PHOTO.height }}
        />
      </div>

      {/* The card is anchored on the slot and animated around it; the clip in
          the keyframes cuts it at the slot line for the descent, so it goes in
          edge first rather than sliding behind the box. */}
      <PostcardFront
        design={design}
        width={CARD_WIDTH}
        className="absolute animate-[postcard-post_2.4s_cubic-bezier(0.4,0,0.5,1)_forwards]"
        style={
          {
            left: SLOT.x,
            top: SLOT.y,
            "--below-slot": `${BELOW_SLOT}px`,
          } as React.CSSProperties
        }
      />

      {rejected && (
        <p
          role="alert"
          className="absolute left-1/2 top-[790px] -translate-x-1/2 px-[80px] text-center text-[20px] text-brick"
        >
          {REJECTION[rejected] ?? FALLBACK_REJECTION}
        </p>
      )}
    </>
  );
}
