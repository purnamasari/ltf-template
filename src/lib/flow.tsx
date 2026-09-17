import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { POSTCARD_DESIGNS } from "./designs";

export type DeliveryChannel = "email" | "wechat";

export type PostcardDraft = {
  designId: string;
  letter: string;
  name: string;
  channel: DeliveryChannel;
  contact: string;
  /** Fixed when the session starts so every screen stamps the same date. */
  writtenOn: Date;
};

type FlowValue = {
  draft: PostcardDraft;
  update: (patch: Partial<PostcardDraft>) => void;
  reset: () => void;
};

function emptyDraft(): PostcardDraft {
  return {
    designId: POSTCARD_DESIGNS[0].id,
    letter: "",
    name: "",
    channel: "email",
    contact: "",
    writtenOn: new Date(),
  };
}

const FlowContext = createContext<FlowValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PostcardDraft>(emptyDraft);

  const update = useCallback((patch: Partial<PostcardDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => setDraft(emptyDraft()), []);

  const value = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowValue {
  const value = useContext(FlowContext);
  if (!value) throw new Error("useFlow must be used inside <FlowProvider>");
  return value;
}

export function useSelectedDesign() {
  const { draft } = useFlow();
  return POSTCARD_DESIGNS.find((design) => design.id === draft.designId) ?? POSTCARD_DESIGNS[0];
}

/** The Wechat field accepts usernames, so only e-mail gets a format check. */
export function isContactValid(channel: DeliveryChannel, contact: string): boolean {
  const value = contact.trim();
  if (!value) return false;
  return channel === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) : value.length >= 3;
}
