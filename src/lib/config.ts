/** Where the Letters API lives. Override per environment in `.env`. */
export const API_BASE =
  import.meta.env.VITE_LETTERS_API_BASE ?? "https://letters.dev.heydewi.com";

/** Shown in the dashboard's device list, so staff can tell tablets apart. */
export const KIOSK_LABEL = import.meta.env.VITE_KIOSK_LABEL ?? "Raffles kiosk";

/** Opens the pairing screen behind the logo gesture. Staff-only. */
export const STAFF_PASSCODE = import.meta.env.VITE_STAFF_PASSCODE ?? "1887";
