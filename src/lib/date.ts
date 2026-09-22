const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** 1 -> "1st", 2 -> "2nd", 22 -> "22nd" ... */
export function ordinalSuffix(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";
  return ["th", "st", "nd", "rd"][day % 10] ?? "th";
}

/**
 * The date shown while the guest is still at the kiosk, computed from the
 * server's `delivery_horizon_days`. The app never decides when anything is
 * sent: the server schedules it and its `scheduled_at` is the one of record.
 */
export function deliveryDate(writtenOn: Date, horizonDays: number): Date {
  const date = new Date(writtenOn);
  date.setDate(date.getDate() + horizonDays);
  return date;
}

/** "01/09/2026" — the stamp line printed on the postcard. */
export function formatStampDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Split so the confirmation screen can set the ordinal as superscript. */
export function formatDeliveryDate(date: Date) {
  return {
    day: date.getDate(),
    suffix: ordinalSuffix(date.getDate()),
    rest: ` of ${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
  };
}

/* The dateline abbreviations the file uses — "1 Sept 2026", not "1 Sep 2026". */
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "June",
  "July", "Aug", "Sept", "Oct", "Nov", "Dec",
];

/** "1 Sept 2026" — the dateline at the head of the letter, as it is read. */
export function formatLetterDate(date: Date): string {
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
