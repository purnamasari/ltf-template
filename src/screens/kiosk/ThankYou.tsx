// FIGMA: 4814:8120 — see docs/design/frames.md
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Backdrop } from "../../components/kiosk/Backdrop";
import { ASSETS } from "../../lib/assets";
import { useFlow } from "../../lib/flow";

/** Seconds the closing card stays up before the kiosk returns to attract mode. */
const AUTO_CLOSE_SECONDS = 8;

export function ThankYou() {
  const navigate = useNavigate();
  const { reset } = useFlow();
  const [remaining, setRemaining] = useState(AUTO_CLOSE_SECONDS);

  useEffect(() => {
    const tick = window.setInterval(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (remaining > 0) return;
    reset();
    navigate({ to: "/" });
  }, [remaining, reset, navigate]);

  return (
    <>
      <Backdrop tone="forest" artboard />

      <img
        src={ASSETS.thankYouCardBack}
        alt=""
        aria-hidden
        className="absolute left-[197px] top-[137px] block h-[479px] w-[798px] max-w-none -rotate-[4.61deg]"
      />
      <img
        src={ASSETS.thankYouCardFront}
        alt=""
        aria-hidden
        className="absolute left-[209px] top-[167px] block h-[419px] w-[767px] max-w-none"
      />

      <img
        src={ASSETS.logoMark}
        alt="Raffles"
        className="absolute left-1/2 top-[212px] block h-[93px] w-[106px] max-w-none -translate-x-1/2"
      />

      <h1 className="absolute left-1/2 top-[295px] w-[594px] -translate-x-1/2 text-center font-display text-[140px] font-[100] leading-[158px] text-ink">
        Thank You
      </h1>

      <div className="absolute left-1/2 top-[460px] -translate-x-1/2 whitespace-nowrap text-center text-[24px] font-medium italic leading-normal text-ink">
        <p>Your postcard will be sent to you, a year from now.</p>
        <p>You will receive a notification in the platform you selected.</p>
      </div>

      <p className="absolute left-1/2 top-[756px] -translate-x-1/2 whitespace-nowrap text-[20px] text-cream opacity-45">
        This window will close in {Math.max(remaining, 0)}s
      </p>
    </>
  );
}
