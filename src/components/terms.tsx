import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CloseButton } from "./chrome";

type TermsValue = {
  open: () => void;
  /** Kept so the tick survives reopening the dialog later in the flow. */
  agreed: boolean;
};

const TermsContext = createContext<TermsValue | null>(null);

/**
 * Privacy and Terms is reachable from the footer link on every screen, so the
 * dialog lives above the whole flow rather than on a step of its own.
 */
export function TermsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const value = useMemo(() => ({ open, agreed }), [open, agreed]);

  return (
    <TermsContext.Provider value={value}>
      {children}
      {isOpen && (
        <TermsDialog
          agreed={agreed}
          onAgree={() => {
            setAgreed(true);
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </TermsContext.Provider>
  );
}

export function useTerms(): TermsValue {
  const value = useContext(TermsContext);
  if (!value) throw new Error("useTerms must be used inside <TermsProvider>");
  return value;
}

function TermsDialog({
  agreed,
  onAgree,
  onClose,
}: {
  agreed: boolean;
  onAgree: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Privacy and Terms"
      className="absolute inset-0 z-50"
    >
      <button
        type="button"
        aria-label="Close terms"
        onClick={onClose}
        className="absolute inset-0 bg-black/56 backdrop-blur-[2px]"
      />

      <div className="absolute left-[119px] top-[164px] h-[507px] w-[952px] rounded-[19px] bg-cream shadow-[0px_3px_2.1px_0px_rgba(0,0,0,0.07),inset_0px_1px_10.3px_0px_rgba(175,145,105,0.18)]">
        <h2 className="absolute left-1/2 top-[55px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[64px] font-light leading-[90px] text-ink">
          Privacy and Terms
        </h2>

        <div className="absolute left-[65px] top-[187px] w-[822px] text-[20px] leading-normal text-ink">
          <p>
            By submitting your letter, you agree that we may collect and securely store the email
            address or WeChat username and letter content you provide so that we can deliver your
            letter to you one year from the date of submission.
          </p>
          <p className="mt-[20px]">
            Your information will be retained for the purpose of delivering your letter and will be
            deleted or anonymised after the delivery period, subject to any applicable legal or
            operational requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={onAgree}
          className="absolute left-[405px] top-[414px] flex items-center gap-[24px] text-[20px] text-brick-dark"
        >
          <span
            aria-hidden
            className="grid size-[21px] place-items-center border border-ink bg-cream text-[15px] leading-none text-ink"
          >
            {agreed ? "✓" : ""}
          </span>
          I Agree
        </button>

        <CloseButton label="Close terms" onClick={onClose} className="left-[878px] top-[6px]" />
      </div>
    </div>
  );
}
