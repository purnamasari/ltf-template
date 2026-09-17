import { useNavigate } from "@tanstack/react-router";
import { ASSETS } from "../lib/assets";

/**
 * The attract screen a guest walks up to: the title set large on a tilted
 * card, over the archival artboard and a script watermark.
 */
export function Cover() {
  const navigate = useNavigate();

  return (
    <>
      <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#886b41]">
        <div className="absolute -left-[313px] -top-[46px] h-[880px] w-[1543px] bg-parchment-light opacity-40" />
        <img
          src={ASSETS.artboard}
          alt=""
          className="absolute -left-[85px] -top-[23px] h-[880px] w-[1543px] max-w-none object-cover opacity-20"
        />
        <div
          className="absolute inset-0 bg-parchment mix-blend-soft-light"
          style={{ boxShadow: "inset 0 4px 62.8px 8px rgba(131, 103, 66, 0.53)" }}
        />
        <p className="absolute left-[calc(50%-24px)] top-[-112px] flex h-[1000px] w-[1561px] -translate-x-1/2 -rotate-[3.96deg] items-center justify-center text-center font-script text-[300px] leading-[0.674] text-white opacity-12">
          Raffles Heritage
        </p>
      </div>

      <img
        src={ASSETS.coverCardBack}
        alt=""
        aria-hidden
        className="absolute left-1/2 top-[150px] block h-[535px] w-[759px] max-w-none -translate-x-1/2 -rotate-[3.66deg]"
      />
      <img
        src={ASSETS.coverCardFront}
        alt=""
        aria-hidden
        className="absolute left-1/2 top-[147px] block h-[535px] w-[759px] max-w-none -translate-x-1/2"
      />

      {/* Franked stamp in the corner of the card */}
      <div aria-hidden className="absolute left-[894px] top-[119px] h-[110px] w-[172px] overflow-clip">
        <div className="absolute inset-[12.49%_16.24%_12.6%_9.12%] overflow-hidden">
          <img
            src={ASSETS.coverStampPhoto}
            alt=""
            className="size-full max-w-none object-cover"
          />
        </div>
        <img
          src={ASSETS.coverStampCancel}
          alt=""
          className="absolute inset-[18.07%_0_54.11%_48.69%] max-w-none mix-blend-multiply"
        />
        <img
          src={ASSETS.coverStampFrame}
          alt=""
          className="absolute inset-[0_10.04%_0.03%_0] max-w-none"
        />
      </div>

      <img
        src={ASSETS.logoMark}
        alt="Raffles"
        className="absolute left-1/2 top-[49px] block h-[93px] w-[106px] max-w-none -translate-x-1/2"
      />

      {/* The title is set as four placed words, exactly as in the design. */}
      <h1 className="absolute inset-0 font-display font-[100] text-[#353b32]">
        <span className="absolute left-[calc(50%-65px)] top-[215px] -translate-x-1/2 whitespace-nowrap text-[150px] leading-[158px]">
          Postcard
        </span>
        <span className="absolute left-[calc(50%+256.5px)] top-[228px] -translate-x-1/2 whitespace-nowrap text-[100px] leading-[158px]">
          to
        </span>
        <span className="absolute left-[calc(50%-216px)] top-[324px] -translate-x-1/2 whitespace-nowrap text-[100px] leading-[158px]">
          the
        </span>
        <span className="absolute left-[calc(50%+93px)] top-[353px] -translate-x-1/2 whitespace-nowrap text-[180px] leading-[158px]">
          Future
        </span>
      </h1>

      <p className="absolute left-1/2 top-[546px] -translate-x-1/2 whitespace-nowrap text-center text-[20px] font-light leading-normal text-ink">
        Every arrival, every encounter, and every memory at Raffles begins a new chapter.
        <br />
        Today, that chapter begins with you.
      </p>

      <button
        type="button"
        onClick={() => navigate({ to: "/intro", search: { beat: 0 } })}
        className="absolute left-[470px] top-[709px] h-[53px] w-[253px] rounded-[48px] border border-[#e8c79c] bg-[rgba(33,50,49,0.74)] text-[20px] text-[#f5e7d3]"
      >
        Discover More
      </button>
    </>
  );
}
