import type { ReactNode } from "react";
import { Backdrop } from "./Backdrop";
import { LogoMark } from "./chrome";
import { ASSETS } from "../../lib/assets";

/**
 * Cover-page furniture behind the narration: washed facade, centred mark and
 * the lettered title.
 */
export function IntroScene({ children }: { children?: ReactNode }) {
  return (
    <>
      <Backdrop artboard />

      <img
        src={ASSETS.hotelFacade}
        alt=""
        aria-hidden
        className="absolute left-[203px] top-[-52px] h-[800px] w-[1199px] max-w-none object-cover opacity-30 mix-blend-multiply"
      />

      <LogoMark className="left-1/2 top-[63px] -translate-x-1/2" />
      <img
        src={ASSETS.wordmark}
        alt="Postcard to the Future"
        className="absolute left-1/2 top-[134px] h-[132px] w-[288px] max-w-none -translate-x-1/2 object-cover"
      />

      {children}
    </>
  );
}
