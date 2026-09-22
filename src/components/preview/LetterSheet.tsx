import { useEffect } from "react";
import { ASSETS } from "../../lib/assets";
import { formatLetterDate } from "../../lib/date";

/**
 * The written side, opened to be read.
 *
 * Only the mobile section of the file draws this, and only because the back of
 * a 351px card is unreadable — at 1048px it is read in place, so the laptop
 * never opens it. The screen decides which it is; this just draws the sheet.
 */
export function LetterSheet({
  letter,
  writtenOn,
  onClose,
}: {
  letter: string;
  writtenOn: Date;
  onClose: () => void;
}) {
  // Reading is a mode: Escape leaves it, as it would any dialog.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your postcard"
      className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-[18px] px-[16px] pb-[130px] pt-[76px]"
    >
      {/* The whole page dims, browser chrome and all — not just the card. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 -z-10 bg-black/45"
      />

      <article className="letter-scroll relative min-h-0 w-full max-h-full max-w-[720px] overflow-y-auto bg-cream px-[20px] py-[22px] shadow-[0_18px_44px_rgba(0,0,0,0.35)] lg:px-[40px] lg:py-[36px]">
        <img
          src={ASSETS.paperTexture}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full max-w-none object-cover opacity-61 mix-blend-multiply"
        />

        <p className="relative text-[17px] leading-[24px] text-ink lg:text-[22px] lg:leading-[30px]">
          Raffles Singapore,
          <br />
          {formatLetterDate(writtenOn)}
        </p>

        <p className="relative mt-[18px] whitespace-pre-wrap text-[16px] leading-[30px] text-ink lg:text-[20px] lg:leading-[36px]">
          {letter}
        </p>
      </article>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="size-[65px] shrink-0"
      >
        <img src={ASSETS.close} alt="" className="block size-full max-w-none" />
      </button>
    </div>
  );
}
