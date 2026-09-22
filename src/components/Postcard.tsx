import type { CSSProperties } from "react";
import { ASSETS } from "../lib/assets";
import { formatStampDate } from "../lib/date";
import type { PostcardDesign } from "../lib/designs";

/** Every postcard is drawn at A6 landscape and scaled from there. */
const BASE_WIDTH = 595;
const BASE_HEIGHT = 420;

/**
 * Where everything sits on the written side, in the 595 x 420 frame.
 *
 * Exported because the A5 download sheet re-draws this same composition onto a
 * canvas, and a canvas cannot read a stylesheet. Geometry belongs beside the
 * layout rather than behind a hook — so it stays here, and the renderer in
 * `src/lib/preview/sheet.ts` imports it instead of carrying a second copy that
 * would quietly drift the first time the frame moves.
 */
export const POSTCARD_ART = {
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  textureOpacity: 0.61,
  rule: { x: 385, y: 20, w: 1, h: 352, colour: "rgba(141, 110, 69, 0.45)" },
  letter: { x: 28, y: 52, w: 330, size: 13, leading: 19.5 },
  stamp: { x: 497, y: 0, w: 92, h: 122 },
  mark: { x: 468, y: 167, w: 32, h: 38 },
  dateline: { x: 435, y: 212, w: 98, colour: "#3f2a10", size: 12, dateSize: 14 },
  /** The stand-in a category without artwork keeps on the picture side. */
  placeholder: { fill: "#dadada", size: 28, colour: "rgba(0, 0, 0, 0.45)" },
} as const;

type SideProps = {
  /** Rendered width in px; the card scales proportionally from 595 x 420. */
  width?: number;
  className?: string;
  /** Merged after the size, so a carousel can place and animate the card. */
  style?: CSSProperties;
};

/**
 * The picture side — a finished archival artwork. `fill` lets an animated
 * carousel own the sizing instead of passing a width.
 */
export function PostcardFront({
  design,
  width = BASE_WIDTH,
  fill = false,
  className = "",
  style,
}: SideProps & { design: PostcardDesign; fill?: boolean }) {
  const shared = `block max-w-none shadow-[0px_4px_4px_0px_rgba(0,0,0,0.08)] ${
    fill ? "size-full" : ""
  } ${className}`;
  const sizing = fill ? style : { width, height: (width / BASE_WIDTH) * BASE_HEIGHT, ...style };

  // A category whose artwork is not in the file yet keeps the frame's own grey
  // stand-in, so the picker reads as unfinished rather than mis-illustrated.
  if (!design.image) {
    return (
      <div
        role="img"
        aria-label={`${design.title} — artwork to come`}
        className={`grid place-items-center px-[40px] text-center text-[28px] italic leading-[1.3] text-black/45 ${shared}`}
        style={{ backgroundColor: POSTCARD_ART.placeholder.fill, ...sizing }}
      >
        {design.title}
      </div>
    );
  }

  return (
    <img
      src={design.image}
      alt={`Raffles Singapore — ${design.title}`}
      className={`object-cover ${shared}`}
      style={sizing}
    />
  );
}

/**
 * The written side. Unlike the picture side this is composed at runtime: the
 * guest's message sits left of the rule, the stamp and dateline to the right.
 */
export function PostcardBack({
  letter,
  writtenOn,
  width = BASE_WIDTH,
  className = "",
  style,
}: SideProps & { letter: string; writtenOn: Date }) {
  const scale = width / BASE_WIDTH;

  return (
    <div
      className={`relative overflow-hidden shadow-[0px_4px_4px_0px_rgba(0,0,0,0.08)] ${className}`}
      style={{ width, height: BASE_HEIGHT * scale, ...style }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left bg-cream"
        style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${scale})` }}
      >
        <img
          src={ASSETS.paperTexture}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full max-w-none object-cover opacity-61 mix-blend-multiply"
        />

        {/* Rule dividing message from address block */}
        <div
          aria-hidden
          className="absolute left-[385px] top-[20px] h-[352px] w-px"
          style={{ backgroundColor: POSTCARD_ART.rule.colour }}
        />

        <p className="absolute left-[28px] top-[52px] w-[330px] whitespace-pre-wrap text-[13px] italic leading-[19.5px] text-ink">
          {letter}
        </p>

        <img
          src={ASSETS.stamp}
          alt=""
          aria-hidden
          className="absolute left-[497px] top-0 block h-[122px] w-[92px] max-w-none"
        />

        <img
          src={ASSETS.logoMark}
          alt=""
          aria-hidden
          className="absolute left-[468px] top-[167px] block h-[38px] w-[32px] max-w-none"
        />

        <p className="absolute left-[435px] top-[212px] w-[98px] text-center leading-normal text-[#3f2a10]">
          <span className="text-[12px] italic">Raffles Singapore, </span>
          <span className="block font-[900] text-[14px]">{formatStampDate(writtenOn)}</span>
        </p>
      </div>
    </div>
  );
}
