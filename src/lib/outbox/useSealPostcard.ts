import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useFlow } from "../flow";
import { enqueue, send } from "./index";

/** The posting animation runs for 2.4s; the screen holds a beat past it. */
const HOLD_MS = 3_200;

/**
 * Seals the postcard.
 *
 * The letter is written to the outbox first and the guest is sent on to the
 * thank you regardless of the network — the tablet is the system of record, and
 * nobody should watch a spinner because the wifi dropped.
 *
 * One exception: when the tablet *is* online, the attempt happens here so that
 * "this address already has a letter" can be said to the person standing in
 * front of the screen. Once they have walked away there is nobody to tell.
 */
export function useSealPostcard() {
  const navigate = useNavigate();
  const { draft } = useFlow();
  const [rejected, setRejected] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // The draft is frozen for the length of this screen — seal exactly once.
    if (started.current) return;
    started.current = true;

    let timer: number | undefined;

    void (async () => {
      const letter = await enqueue({
        body: draft.letter,
        recipient: {
          channel: draft.channel.toUpperCase(),
          address: draft.contact.trim(),
          display_name: draft.name.trim() || undefined,
        },
      });

      const outcome = navigator.onLine ? await send(letter) : { result: "retry" as const };

      if (outcome.result === "rejected") {
        setRejected(outcome.code);
        return;
      }

      timer = window.setTimeout(() => navigate({ to: "/thank-you" }), HOLD_MS);
    })();

    return () => window.clearTimeout(timer);
    // The draft is frozen for the length of this screen, and a re-run would
    // clear the pending navigation and then bail on the guard above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { rejected };
}
