import { useNavigate } from "@tanstack/react-router";
import { Backdrop } from "../components/Backdrop";
import { LogoMark, PrivacyLink, ProgressBar, StepNav } from "../components/chrome";
import { UnderlinedField } from "../components/UnderlinedField";
import { isContactValid, useFlow } from "../lib/flow";
import type { DeliveryChannel } from "../lib/flow";

const CHANNELS: { id: DeliveryChannel; label: string; placeholder: string }[] = [
  { id: "email", label: "E-mail", placeholder: "Your E-mail Address" },
  { id: "wechat", label: "Wechat", placeholder: "Your Wechat Username" },
];

export function Delivery() {
  const navigate = useNavigate();
  const { draft, update } = useFlow();
  const channel = CHANNELS.find((option) => option.id === draft.channel) ?? CHANNELS[0];

  return (
    <>
      <Backdrop />
      <ProgressBar value={1016 / 1193} />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[234px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[46px] font-light leading-[58px] text-ink">
        How would you like to receive your postcard?
      </h1>

      <div className="absolute left-[233px] top-[303px] flex w-[728px] gap-[22px]">
        {CHANNELS.map((option) => {
          const selected = option.id === draft.channel;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => update({ channel: option.id, contact: "" })}
              aria-pressed={selected}
              className={`flex h-[64px] w-[353px] items-center gap-[20px] rounded-full pl-[26px] text-[20px] transition-colors duration-200 ${
                selected ? "bg-forest text-on-forest" : "border border-ink text-ink"
              }`}
            >
              <span
                aria-hidden
                className={`grid size-[20px] place-items-center rounded-full border ${
                  selected ? "border-on-forest" : "border-ink"
                }`}
              >
                {selected && <span className="size-[10px] rounded-full bg-on-forest" />}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>

      <UnderlinedField
        label={channel.placeholder}
        placeholder={channel.placeholder}
        type={draft.channel === "email" ? "email" : "text"}
        value={draft.contact}
        onChange={(contact) => update({ contact })}
      />

      <StepNav
        onBack={() => navigate({ to: "/name" })}
        onNext={() => navigate({ to: "/confirm" })}
        nextDisabled={!isContactValid(draft.channel, draft.contact)}
      />

      <PrivacyLink />
    </>
  );
}
