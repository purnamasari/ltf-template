// FIGMA: 4836:10970 — see docs/design/frames.md
import { Backdrop } from "../components/Backdrop";
import { LogoMark, ProgressBar } from "../components/chrome";
import { PostcardFront } from "../components/Postcard";
import { POSTBOX, Postbox } from "../components/Postbox";
import { useSubmitPostcard } from "../lib/submission";
import { useSelectedDesign } from "../lib/flow";

/** Where the box stands, and the card's resting place above it. */
const BOX_TOP = 490;
const CARD_TOP = 200;
const CARD_WIDTH = 452;

/** A few px inside the mouth, so the card's edge vanishes into the dark. */
const MOUTH_Y = BOX_TOP + POSTBOX.slotTop + 6;

/**
 * The postcard is handed over while it is posted on screen, so the guest
 * watches it go rather than watching a spinner.
 */
export function Sending() {
  const design = useSelectedDesign();
  const { failed } = useSubmitPostcard();

  return (
    <>
      <Backdrop />
      <ProgressBar value={1} />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[70px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[40px] font-[100] leading-normal text-ink">
        Delivering Your Postcard to a Year from Now...
      </h1>

      <Postbox className="left-1/2 -translate-x-1/2" style={{ top: BOX_TOP }} />

      {/* Everything below the mouth is clipped away, so the card is cut off at
          the slot line and slides in edge first rather than behind the box. */}
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ height: MOUTH_Y }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: CARD_TOP,
            width: CARD_WIDTH,
            perspective: "1100px",
            perspectiveOrigin: "50% 100%",
          }}
        >
          <PostcardFront
            design={design}
            width={CARD_WIDTH}
            className="animate-[postcard-post_2.4s_cubic-bezier(0.4,0,0.5,1)_forwards]"
          />
        </div>
      </div>

      {failed && (
        <p
          role="alert"
          className="absolute left-1/2 top-[790px] -translate-x-1/2 text-[20px] text-brick"
        >
          We could not send your postcard just now. Please ask a member of staff for help.
        </p>
      )}
    </>
  );
}
