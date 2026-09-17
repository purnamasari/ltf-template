import { useNavigate } from "@tanstack/react-router";
import { Backdrop } from "../components/Backdrop";
import { LogoMark, PrivacyLink, ProgressBar, StepNav } from "../components/chrome";
import { UnderlinedField } from "../components/UnderlinedField";
import { useFlow } from "../lib/flow";

export function YourName() {
  const navigate = useNavigate();
  const { draft, update } = useFlow();

  return (
    <>
      <Backdrop />
      <ProgressBar value={767 / 1193} />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[313px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[46px] font-light leading-[58px] text-ink">
        How would you like to be addressed?
      </h1>

      <UnderlinedField
        label="Your name"
        placeholder="Your Name"
        value={draft.name}
        onChange={(name) => update({ name })}
        autoFocus
      />

      <StepNav
        onBack={() => navigate({ to: "/preview" })}
        onNext={() => navigate({ to: "/delivery" })}
        nextDisabled={draft.name.trim().length === 0}
      />

      <PrivacyLink />
    </>
  );
}
