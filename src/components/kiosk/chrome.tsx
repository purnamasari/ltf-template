import type { ReactNode } from "react";
import { ASSETS } from "../../lib/assets";
import { useTerms } from "./terms";

/**
 * Raffles tree-and-wordmark, stacked. Sits top-left on flow screens, centred on
 * covers.
 *
 * Height only, with the width left to follow the artwork: Figma's SVG exports
 * carry `preserveAspectRatio="none"`, so a box whose ratio is off the mark's own
 * 80 : 71 flattens it rather than letter-boxing it. `object-contain` is the
 * second guard. The preview's `Wordmark` is a different export, set wide — the
 * two are not interchangeable.
 */
export function LogoMark({
  className = "",
  height = 71,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <img
      src={ASSETS.logoMark}
      alt="Raffles"
      className={`absolute w-auto max-w-none object-contain ${className}`}
      style={{ height }}
    />
  );
}

/** Opens the Privacy and Terms dialog; present on every screen of the flow. */
export function PrivacyLink({
  tone = "muted",
  className = "left-[52px] top-[779px]",
}: {
  tone?: "muted" | "gold";
  className?: string;
}) {
  const { open } = useTerms();

  return (
    <button
      type="button"
      onClick={open}
      className={`absolute text-[16px] ${className} ${
        tone === "gold" ? "text-gold-soft" : "text-[#7c5439] opacity-48"
      }`}
    >
      Privacy and Terms
    </button>
  );
}

type PillButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
};

/** The 253 x 53 pill used for Back / Next on every step. */
export function PillButton({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  className = "",
}: PillButtonProps) {
  const base =
    "absolute h-[53px] w-[253px] rounded-[48px] text-[20px] transition-opacity duration-200";
  const look =
    variant === "primary"
      ? "bg-forest text-on-forest"
      : "border border-ink text-brick";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${look} ${disabled ? "!text-ink opacity-46" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

/** Back / Next pair, pinned to the position they hold on every step. */
export function StepNav({
  onBack,
  onNext,
  nextDisabled = false,
  backLabel = "Back",
  nextLabel = "Next",
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  /** Some frames name the pills after where they go, e.g. "Choose Design". */
  backLabel?: string;
  nextLabel?: string;
}) {
  return (
    <>
      <PillButton className="left-[333px] top-[693px]" onClick={onBack}>
        {backLabel}
      </PillButton>
      <PillButton
        className="left-[608px] top-[693px]"
        variant={nextDisabled ? "secondary" : "primary"}
        disabled={nextDisabled}
        onClick={onNext}
      >
        {nextLabel}
      </PillButton>
    </>
  );
}

export function CarouselArrow({
  direction,
  onClick,
  className = "",
  label,
}: {
  direction: "left" | "right";
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? (direction === "left" ? "Previous" : "Next")}
      className={`absolute size-[46px] overflow-clip ${className}`}
    >
      {/* One chevron is exported; the left arrow is the same glyph turned round. */}
      <img
        src={ASSETS.arrowRight}
        alt=""
        className={`block size-full max-w-none ${direction === "left" ? "rotate-180" : ""}`}
      />
    </button>
  );
}

/** Carousel position indicator — 10px dots, 20.67px apart, as exported. */
export function Dots({
  count,
  active,
  className = "",
}: {
  count: number;
  active: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={`absolute flex items-center gap-[10.67px] ${className}`}>
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

export function CloseButton({
  onClick,
  className = "",
  label = "Close",
}: {
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute size-[65.13px] overflow-clip ${className}`}
    >
      <img src={ASSETS.close} alt="" className="block size-full max-w-none" />
    </button>
  );
}
