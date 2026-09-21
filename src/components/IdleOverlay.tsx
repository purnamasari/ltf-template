// FIGMA: 4991:3777 — see docs/design/frames.md
import { CloseButton } from "./chrome";

/**
 * "Are you still there?" — raised over the writing step once the guest has
 * gone quiet. Tapping anywhere dismisses it; the bar across the foot of the
 * card runs down to the reset.
 */
export function IdleOverlay({
  elapsed,
  onDismiss,
}: {
  elapsed: number;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Are you still there?"
      className="absolute inset-0 z-50"
    >
      {/* The whole screen is the dismiss target, as the card says. */}
      <button
        type="button"
        aria-label="Continue writing"
        onClick={onDismiss}
        className="absolute inset-0 bg-black/32"
      />

      <div className="absolute left-[172px] top-[220px] h-[395px] w-[850px] overflow-hidden rounded-[19px] bg-cream shadow-[0px_3px_2.1px_0px_rgba(0,0,0,0.07),inset_0px_1px_10.3px_0px_rgba(175,145,105,0.18)]">
        <h2 className="absolute left-1/2 top-[52px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[64px] font-light leading-[90px] text-ink">
          Are you still there?
        </h2>

        <p className="absolute left-1/2 top-[185px] w-[486px] -translate-x-1/2 text-center text-[20px] leading-[1.45] text-ink">
          It looks like you’ve stopped writing for a while.
          <br />
          This experience will be reset shortly.
        </p>

        <p className="absolute left-1/2 top-[271px] w-[418px] -translate-x-1/2 text-center text-[18px] leading-normal text-ink">
          Tap anywhere on the screen to continue writing
        </p>

        <CloseButton
          label="Continue writing"
          onClick={onDismiss}
          className="left-[774px] top-[39px]"
        />

        {/* Runs the width of the card at its foot, filling towards the reset. */}
        <div aria-hidden className="absolute bottom-0 left-0 h-[9px] w-full bg-track">
          <div
            className="h-full bg-forest-dark"
            style={{ width: `${Math.min(Math.max(elapsed, 0), 1) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
