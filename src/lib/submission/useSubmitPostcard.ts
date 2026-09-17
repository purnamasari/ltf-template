import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useFlow } from "../flow";
import { submitPostcard } from "./api";

/**
 * Owns handing the finished postcard over: when it is sent, what happens on
 * success, what the screen is told on failure.
 *
 * This lives outside `src/screens` on purpose. The Sending screen is a Figma
 * frame and gets re-synced from the design file; anything that talks to the
 * network, retries, or decides where the guest goes next would be at risk every
 * time the frame moves. The screen renders `state` and nothing more — see
 * docs/design/frames.md.
 */
export function useSubmitPostcard() {
  const navigate = useNavigate();
  const { draft } = useFlow();

  const { mutate, isSuccess, isError } = useMutation({ mutationFn: submitPostcard });

  useEffect(() => {
    mutate(draft);
    // The draft is frozen for the length of this screen — submit exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isSuccess) navigate({ to: "/thank-you" });
  }, [isSuccess, navigate]);

  return { failed: isError };
}
