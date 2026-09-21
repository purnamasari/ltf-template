// FIGMA: 4808:8058 — see docs/design/frames.md
import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Backdrop } from "../components/Backdrop";
import { CarouselArrow, Dots, LogoMark, PrivacyLink, StepNav } from "../components/chrome";
import { PostcardBack, PostcardFront } from "../components/Postcard";
import { deliveryDate, formatDeliveryDate } from "../lib/date";
import { meta } from "../lib/meta";
import { useFlow, useSelectedDesign } from "../lib/flow";
import { useSwipe, wrapIndex } from "../lib/useSwipe";

/** Where the card in front sits, and how far the one behind is offset. */
const FRONT = { left: 471, top: 180 };
const BEHIND = { x: 36, y: -33 };

export function Confirmation() {
  const navigate = useNavigate();
  const { draft } = useFlow();
  const design = useSelectedDesign();
  const [position, setPosition] = useState(0);

  const face = wrapIndex(position, 2); // 0 = picture side, 1 = written side
  const flip = (delta: number) => setPosition((current) => current + delta);
  const swipe = useSwipe({ axis: "x", onNext: () => flip(1), onPrevious: () => flip(-1) });

  const delivery = formatDeliveryDate(deliveryDate(draft.writtenOn, meta().delivery_horizon_days));

  const cardStyle = (isFront: boolean) => ({
    transform: isFront ? "translate(0px, 0px)" : `translate(${BEHIND.x}px, ${BEHIND.y}px)`,
    opacity: isFront ? 1 : 0.85,
    zIndex: isFront ? 20 : 10,
  });

  return (
    <>
      <Backdrop />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[70px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[40px] font-[100] leading-normal text-ink">
        Confirmation
      </h1>

      <p className="absolute left-[57px] top-[198px] whitespace-nowrap font-display text-[26px] font-light text-ink">
        This postcard will be sent to:
      </p>
      <SummaryRow value={draft.name} top={254} />
      <SummaryRow value={draft.contact} top={314} italic />

      <p className="absolute left-[57px] top-[394px] whitespace-nowrap font-display text-[26px] font-light text-ink">
        To be delivered on:
      </p>
      <SummaryRow
        top={450}
        value={
          <>
            {delivery.day}
            <sup className="text-[12.9px]">{delivery.suffix}</sup>
            {delivery.rest}
          </>
        }
      />

      <div {...swipe} className="absolute left-[440px] top-[130px] h-[470px] w-[660px]">
        <PostcardFront
          design={design}
          width={595}
          className="absolute transition-[transform,opacity] duration-[450ms] ease-out"
          style={{ left: FRONT.left - 440, top: FRONT.top - 130, ...cardStyle(face === 0) }}
        />
        <PostcardBack
          letter={draft.letter}
          writtenOn={draft.writtenOn}
          width={593}
          className="absolute transition-[transform,opacity] duration-[450ms] ease-out"
          style={{ left: FRONT.left - 440, top: FRONT.top - 130, ...cardStyle(face === 1) }}
        />
      </div>

      <CarouselArrow
        direction="left"
        onClick={() => flip(-1)}
        label="Show the other side"
        className="z-30 left-[418px] top-[364px]"
      />
      <CarouselArrow
        direction="right"
        onClick={() => flip(1)}
        label="Show the other side"
        className="z-30 left-[1108px] top-[364px]"
      />

      <Dots count={2} active={face} className="left-[768px] top-[630px]" />

      <StepNav
        onBack={() => navigate({ to: "/delivery" })}
        onNext={() => navigate({ to: "/sending" })}
        nextLabel="Send"
      />

      <PrivacyLink />
    </>
  );
}

/** One confirmed value sitting on a 326px rule. */
function SummaryRow({
  value,
  top,
  italic = false,
}: {
  value: ReactNode;
  top: number;
  italic?: boolean;
}) {
  return (
    <div className="absolute left-[57px] w-[326px]" style={{ top }}>
      <p className={`px-[11px] text-[20px] leading-normal text-ink ${italic ? "italic" : ""}`}>
        {value}
      </p>
      <div aria-hidden className="mt-[9px] h-px w-full bg-gold" />
    </div>
  );
}
