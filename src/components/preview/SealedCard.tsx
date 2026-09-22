const SEAL = "relative grid place-items-center overflow-hidden bg-gold";

/**
 * The card before it is opened: no artwork, just flat gold with an inner glow
 * burned into the edges and the invitation set in the middle of it. Sized by
 * the caller so it keeps the same A6 footprint as the real card and nothing
 * shifts when it is revealed.
 *
 * The frame layers the linen grain under the gold, which is opaque — so none of
 * it comes through, and drawing it would be drawing something invisible.
 *
 * Without `onReveal` it is the same gold face with nothing written on it and
 * nothing to press: that is the copy the screen lays over the artwork and fades
 * out, so the picture is uncovered rather than swapped in.
 */
export function SealedCard({
  width,
  onReveal,
  className = "",
}: {
  width: number;
  onReveal?: () => void;
  className?: string;
}) {
  const size = { width, height: (width / 595) * 420 };

  const glow = (
    <span
      aria-hidden
      className="absolute inset-0"
      style={{ boxShadow: "inset 0px 1px 28.3px 0px rgba(145, 115, 75, 0.63)" }}
    />
  );

  if (!onReveal) {
    return (
      <div aria-hidden style={size} className={`${SEAL} ${className}`}>
        {glow}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onReveal}
      style={size}
      className={`${SEAL} shadow-[0px_9px_12.5px_0px_rgba(0,0,0,0.05)] ${className}`}
    >
      {glow}
      <span className="relative block text-center font-sans text-[18px] font-light italic text-ink lg:text-[36px]">
        {/* The frames say "Tap" on the phone and "Click" on the laptop. */}
        <span className="lg:hidden">Tap to reveal your postcard</span>
        <span className="hidden lg:inline">Click to reveal your postcard</span>
      </span>
    </button>
  );
}
