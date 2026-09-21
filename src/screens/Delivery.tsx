// FIGMA: 4808:5417 — see docs/design/frames.md
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Backdrop } from "../components/Backdrop";
import { LogoMark, PrivacyLink, StepNav } from "../components/chrome";
import { UnderlinedField } from "../components/UnderlinedField";
import { isContactValid, useFlow } from "../lib/flow";
import type { DeliveryChannel } from "../lib/flow";
import { meta } from "../lib/meta";

const ALL_CHANNELS: { id: DeliveryChannel; label: string; placeholder: string }[] = [
  { id: "email", label: "E-mail", placeholder: "E-mail Address" },
  { id: "wechat", label: "Wechat", placeholder: "Wechat Username" },
];

export function Delivery() {
  const navigate = useNavigate();
  const { draft, update } = useFlow();

  const [notice, setNotice] = useState<string | null>(null);

  /**
   * Raised on a tap, never while typing — a half-entered address is not yet
   * wrong. Cleared on the next keystroke so the message goes as soon as the
   * guest starts fixing it.
   */
  const [malformed, setMalformed] = useState(false);

  /**
   * Both options are drawn in `4808:5417` and both stay on screen, because
   * Wechat is coming: it is scheduled for the first release after launch, once
   * the official account exists. Until `meta.channels` lists it, the button is
   * shown disabled and says so when tapped — a guest who wants Wechat learns it
   * is on the way rather than finding it missing. Nothing changes here when it
   * goes live; the server starts listing the channel and the button wakes up.
   */
  const isLive = (option: (typeof ALL_CHANNELS)[number]) =>
    meta().channels.includes(option.id.toUpperCase());

  const live = ALL_CHANNELS.filter(isLive);
  const channel = live.find((option) => option.id === draft.channel) ?? live[0];

  /** A draft left on a channel that has since gone away falls back to a live one. */
  useEffect(() => {
    if (channel && channel.id !== draft.channel) update({ channel: channel.id, contact: "" });
  }, [channel, draft.channel, update]);

  /** The prompt is a moment, not a state — it clears itself. */
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <>
      <Backdrop />
      <LogoMark className="left-[52px] top-[58px]" />

      <h1 className="absolute left-1/2 top-[234px] -translate-x-1/2 whitespace-nowrap text-center font-display text-[46px] font-light leading-[58px] text-ink">
        How would you like to receive your postcard?
      </h1>

      <div className="absolute left-[233px] top-[303px] flex w-[728px] gap-[22px]">
        {ALL_CHANNELS.map((option) => {
          const available = isLive(option);
          const selected = available && option.id === draft.channel;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                available
                  ? update({ channel: option.id, contact: "" })
                  : setNotice(`${option.label} is on its way — it will be available soon.`)
              }
              aria-pressed={selected}
              aria-disabled={!available}
              className={`flex h-[64px] w-[353px] items-center gap-[20px] rounded-full pl-[26px] text-[20px] transition-colors duration-200 ${
                selected ? "bg-forest text-on-forest" : "border border-ink text-ink"
              } ${available ? "" : "opacity-40"}`}
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

      {notice && (
        <p
          role="status"
          className="absolute left-[233px] top-[374px] w-[728px] text-[16px] leading-[20px] text-ink-muted"
        >
          {notice} Please choose e-mail for now.
        </p>
      )}

      <UnderlinedField
        label={channel.placeholder}
        placeholder={channel.placeholder}
        type={draft.channel === "email" ? "email" : "text"}
        value={draft.contact}
        onChange={(contact) => {
          setMalformed(false);
          update({ contact });
        }}
        invalid={malformed}
      />

      {malformed && (
        <p
          role="alert"
          className="absolute left-[233px] top-[478px] w-[728px] text-[18px] leading-[24px] text-brick"
        >
          {draft.channel === "email"
            ? "That does not look like an e-mail address. Check it and try again."
            : "That does not look like a Wechat username. Check it and try again."}
        </p>
      )}

      {/*
        Next stays live once anything has been typed. A greyed-out button gives
        a guest nothing to act on — they cannot tell whether the kiosk is broken
        or their address is wrong — so the check happens on the tap and says
        what is wrong.
      */}
      <StepNav
        onBack={() => navigate({ to: "/preview" })}
        onNext={() => {
          if (!isContactValid(draft.channel, draft.contact)) {
            setMalformed(true);
            return;
          }
          navigate({ to: "/confirm" });
        }}
        nextDisabled={draft.contact.trim().length === 0}
      />

      <PrivacyLink />
    </>
  );
}
