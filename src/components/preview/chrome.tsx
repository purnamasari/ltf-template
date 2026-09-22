import { ASSETS } from "../../lib/assets";

/**
 * The pieces that sit around the postcard on the recipient's page.
 *
 * Deliberately not the kiosk's `chrome.tsx`: every part of that one is
 * absolutely positioned in the 1194 x 834 frame, because the kiosk has no
 * layout to speak of. Here the page is a column that has to survive a 393px
 * phone and a 1920px laptop, so these take part in the flow instead.
 */

/**
 * 33px tall on the phone, 47px on the laptop — the wide lockup, which is a
 * different export from the kiosk's stacked 80 x 71 `logoMark`.
 *
 * Height only, with the width left to follow: Figma's SVG exports carry
 * `preserveAspectRatio="none"`, so a box whose ratio is even slightly off the
 * artwork's flattens it rather than letter-boxing it. `object-contain` is the
 * second guard, in case a future box does set both.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <img
      src={ASSETS.logoWordmarkWide}
      alt="Raffles"
      className={`block h-[33px] w-auto object-contain lg:h-[47px] ${className}`}
    />
  );
}

/**
 * 46px on a phone, 66px on a laptop. The exported file is the whole control —
 * forest disc and white chevron — so the left arrow is the same file turned.
 */
export function StoryArrow({
  direction,
  onClick,
  label,
  className = "",
}: {
  direction: "left" | "right";
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`size-[46px] shrink-0 rounded-full transition-opacity active:opacity-70 lg:size-[66px] ${className}`}
    >
      <img
        src={ASSETS.arrowRight}
        alt=""
        className={`block size-full max-w-none ${direction === "left" ? "rotate-180" : ""}`}
      />
    </button>
  );
}

/** Which side of the card is showing. The web frames draw no dots. */
export function StoryDots({ count, active }: { count: number; active: number }) {
  return (
    <div aria-hidden className="flex items-center gap-[10.67px]">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="size-[10px] rounded-full"
          style={{
            backgroundColor: index === active ? "#523F29" : "rgba(175, 145, 105, 0.5)",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Full width of the gutter on a phone, a 315px pill on a laptop.
 *
 * `busy` covers the moment the A5 sheet is being drawn. The frames have no such
 * state, so it is the quietest one that still stops a second press: the label
 * does not change, the button only dims and stops taking the pointer.
 */
export function DownloadButton({ onClick, busy = false }: { onClick: () => void; busy?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className="flex h-[55px] w-full items-center justify-center gap-[12px] rounded-[40px] bg-forest text-[16px] text-white transition-opacity active:opacity-85 disabled:opacity-70 lg:h-[65px] lg:w-[315px] lg:gap-[18px] lg:text-[24px]"
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[15px] lg:size-[20px]"
      >
        <path d="M8 1.5v9" />
        <path d="M4.5 7.5 8 11l3.5-3.5" />
        <path d="M2 13.5h12" />
      </svg>
      Download
    </button>
  );
}

/**
 * The paper the whole page is printed on: flat #f1f0e7 with the same linen
 * texture the kiosk uses, turned 180° and multiplied over it at 35%.
 *
 * Fixed rather than absolute, so the grain does not scroll away from under a
 * long letter on a phone.
 */
export function Ground() {
  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden bg-track">
      <div
        className="absolute -inset-[4%] rotate-180 opacity-35 mix-blend-multiply"
        style={{
          backgroundImage: `url(${ASSETS.paperTexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
}
