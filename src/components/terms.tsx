import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CloseButton, PillButton } from "./chrome";
import { Sky, StageFrame } from "./Stage";

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

function TermsDialog({ onAgree, onClose }: { onAgree: () => void; onClose: () => void }) {
  return (
    <Sky>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Privacy and Terms"
        className="pointer-events-auto absolute inset-0 z-50"
      >
        {/* The dimmer covers the screen, not the frame: the paper runs past the
            frame's edges, and a scrim that stopped there would leave it lit. */}
        <button
          type="button"
          aria-label="Close terms"
          onClick={onClose}
          className="absolute inset-0 bg-black/56 backdrop-blur-[2px]"
        />

        {/* The card keeps its position from Figma, so it goes back into a box
            the size of the frame, scaled exactly as the frame is. */}
        <StageFrame>
          <div className="pointer-events-auto absolute left-[119px] top-[107px] h-[600px] w-[952px] rounded-[19px] bg-cream shadow-[0px_3px_2.1px_0px_rgba(0,0,0,0.07),inset_0px_1px_10.3px_0px_rgba(175,145,105,0.18)]">
            <h2 className="absolute left-1/2 top-[55px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[64px] font-light leading-[90px] text-ink">
              Privacy and Terms
            </h2>

            {/* 822 x 288 in the frame, which is eleven lines on a 26px rhythm with
                a single gap before the list — no space between the bullets. */}
            <div className="absolute left-[67px] top-[187px] w-[822px] text-[20px] leading-[26px] text-ink">
              <p>
                By clicking I Agree, you agree to our [Terms of Service] and consent to our handling
                of your data as outlined below:
              </p>
              <ul className="mt-[20px] list-disc pl-[30px]">
                <li>
                  Data Collection &amp; Purpose: We collect your contact information (email address
                  or WeChat username) and the content of your postcard solely to process, store, and
                  deliver your postcard to you exactly one year from your submission date.
                </li>
                <li>
                  Storage &amp; Security: Your data is stored securely using industry-standard
                  encryption and security measures to prevent unauthorized access.
                </li>
                <li>
                  Data Retention &amp; Deletion: We retain your information only as long as
                  necessary to complete delivery. Once your postcard has been delivered, your
                  contact details and message will be permanently deleted or anonymized, except
                  where retention is required by applicable law.
                </li>
              </ul>
            </div>

            {/*
              Decline closes the dialog without recording agreement — the same as
              the cross. The frame does not say whether it should also abandon the
              session and return to the cover; that is a product decision.
            */}
            <PillButton className="left-[209px] top-[501px]" onClick={onClose}>
              Decline
            </PillButton>
            <PillButton className="left-[490px] top-[501px]" variant="primary" onClick={onAgree}>
              I Agree
            </PillButton>

            <CloseButton label="Close terms" onClick={onClose} className="left-[878px] top-[38px]" />
          </div>
        </StageFrame>
      </div>
    </Sky>
  );
}
