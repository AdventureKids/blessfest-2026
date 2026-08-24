/* The BlessFest service shifts. The two day-of shifts (1 & 2) are time windows a
   volunteer picks on the form; a volunteer can sign up for one or both, and each
   is assigned and messaged independently, so shift is stored per volunteer row.

   A few areas also take help OFF the day of the event (e.g. clothing sorting on
   misc dates, kitchen prep the week of). Rather than stand those up as their own
   areas, they're modeled as extra area-specific "shifts" so those volunteers get
   the same team page + onboarding as everyone else. Such a shift carries `area`
   (the only area it belongs to) and has no `dayOf` flag.

   Windows/labels match the Formstack form's field labels (what people saw when
   they signed up). If those times change, change them here — every text and
   badge reads from this. */

export const SHIFTS = {
  "1": { label: "Shift 1", window: "6:45–10 AM", dayOf: true },
  "2": { label: "Shift 2", window: "9:45 AM–1:15 PM", dayOf: true },
  // Off-day, area-specific opportunities (see note above).
  "sorting": { label: "Clothing Sorting", window: "Misc dates", area: "clothing" },
  "prep": { label: "Kitchen Prep", window: "week of BF", area: "food-prep" },
};

export const shiftWindow = (s) => (SHIFTS[s] ? SHIFTS[s].window : "");
export const shiftLabel = (s) => (SHIFTS[s] ? SHIFTS[s].label : "");
/* Any shift we know about (day-of or off-day area shift). */
export const isShift = (s) => Object.prototype.hasOwnProperty.call(SHIFTS, s);
/* A timed, day-of-event shift (1 or 2) vs. an off-day area opportunity. */
export const isDayOfShift = (s) => !!(SHIFTS[s] && SHIFTS[s].dayOf);
/* Shift ids assignable for a given area: the two day-of shifts, plus any
   off-day shift scoped to that area. */
export const shiftsForArea = (areaId) =>
  Object.keys(SHIFTS).filter((k) => SHIFTS[k].dayOf || SHIFTS[k].area === areaId);
