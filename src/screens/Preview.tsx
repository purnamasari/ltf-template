// FIGMA: 4802:3876 — see docs/design/frames.md
import { useNavigate } from "@tanstack/react-router";
import { Backdrop } from "../components/Backdrop";
import { LogoMark, PrivacyLink, StepNav } from "../components/chrome";
import { PostcardBack } from "../components/Postcard";
import { useFlow } from "../lib/flow";

export function Preview() {
  const navigate = useNavigate();
  const { draft } = useFlow();

  return (
    <>
      <Backdrop />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[70px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[40px] font-[100] leading-normal text-ink">
        Preview
      </h1>

      {/* Only the written side is shown here — the guest is checking their own
          words, so the card sits centred on its own. */}
      <PostcardBack
        letter={draft.letter}
        writtenOn={draft.writtenOn}
        width={686}
        className="absolute left-1/2 top-[167px] -translate-x-1/2"
      />

      <StepNav
        onBack={() => navigate({ to: "/write" })}
        onNext={() => navigate({ to: "/delivery" })}
        backLabel="Edit Message"
        nextLabel="Confirm"
      />

      <PrivacyLink />
    </>
  );
}
