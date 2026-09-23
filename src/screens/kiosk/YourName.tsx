// FIGMA: 4808:4040 — see docs/design/frames.md
import { useNavigate } from "@tanstack/react-router";
import { Backdrop } from "../../components/kiosk/Backdrop";
import { LogoMark, PrivacyLink, StepNav } from "../../components/kiosk/chrome";
import { UnderlinedField } from "../../components/kiosk/UnderlinedField";
import { useFlow } from "../../lib/flow";

export function YourName() {
  const navigate = useNavigate();
  const { draft, update } = useFlow();

  const named = draft.name.trim().length > 0;
  const next = () => {
    if (named) navigate({ to: "/design" });
  };

  return (
    <>
      <Backdrop />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[313px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[46px] font-light leading-[58px] text-ink">
        What’s your name?
      </h1>

      <UnderlinedField
        label="Your name"
        placeholder="Name"
        value={draft.name}
        onChange={(name) => update({ name })}
        autoFocus
        align="center"
        onSubmit={next}
      />

      <StepNav
        onBack={() => navigate({ to: "/intro", search: { beat: 2 } })}
        onNext={next}
        nextDisabled={!named}
      />

      <PrivacyLink />
    </>
  );
}
