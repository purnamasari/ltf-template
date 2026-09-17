import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { loadMeta } from "./meta";
import { checkDevice } from "./pairing";

/**
 * What happens once, when the kiosk starts.
 *
 * Reads the server's rules so the form validates against them rather than
 * against guesses that drift, then confirms the stored bearer still works. An
 * unpaired or revoked tablet goes to the pairing screen instead of the cover —
 * it cannot submit anything until staff approve it.
 */
export function useKioskBoot() {
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      const rules = await loadMeta();
      const paired = await checkDevice();
      if (rules.device_pairing_required && !paired) navigate({ to: "/pair" });
    })();
  }, [navigate]);
}
