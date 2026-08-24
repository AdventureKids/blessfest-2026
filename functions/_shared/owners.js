/* ============================================================
   WHO CAN EDIT WHAT
   The only file you edit to add/remove a leader or move an area
   between leaders. Area ids must match `id` in data.js.
   ============================================================ */

/* The four overseers. Each can edit the copy on every area page.
   (Case doesn't matter — lookups are lowercased.) */
export const ADMINS = [
  "christian.kopeny@cc-ea.org",     // Christian Kopeny
  "ryan.young@cc-ea.org",           // Ryan Young
  "jim.richards@cc-ea.org",         // Pastor Jim Richards
  "ben.goodner@cc-ea.org",          // Ben Goodner
  "scott.wiedensohler@cc-ea.org",   // Scott Wiedensohler (also leads Emergency Response)
];

/* Per-area editors — an individual area lead who should be able to edit
   only their own page(s). Empty today: the four overseers above cover
   every area. Add entries here to scope someone to a subset.
     "tanya.cox@example.com": ["hair"],
   Area ids must match `id` in data.js. */
export const OWNERS = {};

/* The only fields a leader may change. Everything else in data.js
   (id, name, icon, commitment/shift times, photos, lead) is yours
   alone — a save request touching them is ignored server-side. */
export const TEXT_FIELDS = ["tagline", "summary"];
export const LIST_FIELDS = ["whatYoullDo", "needs", "requirements"];
export const EDITABLE_FIELDS = [...TEXT_FIELDS, ...LIST_FIELDS];

/* ============================================================
   TEAM-PORTAL PERMISSIONS (separate from copy-editing above)
   ============================================================ */

/* Area leaders who may post to THEIR OWN area's message board only.
   email -> [area ids]. This grants board access, NOT copy-edit access.
   Emails are matched case-insensitively. */
export const AREA_LEADERS = {
  "mrstycox@gmail.com": ["hair"],
  "mrssandraangulo@gmail.com": ["nails"],
  "dianalopez1977@yahoo.com": ["nails"], // Diana Lopez — Nails co-lead (added 2026-08-19)
  "kyle.poffenberger@cc-ea.org": ["clothing"],
  "becky.kopeny@cc-ea.org": ["boutique"],
  "susan.bauerle@cc-ea.org": ["craft"],
  "zack.moore@cc-ea.org": ["food-prep"],
  "davidbarrs@yahoo.com": ["food-service"],
  "sunnyday1@silverlion.net": ["food-service"],
  "kingc67@yahoo.com": ["dining-room"],
  "ozzie.castillo@cc-ea.org": ["prayer-evangelism"],
  "mcguire7576@gmail.com": ["prayer-evangelism"],
  "josh.teasley@cc-ea.org": ["welcome-greeter"],
  "rachael.kinoshita@cc-ea.org": ["guest-check-in"],
  "christena.mancino@cc-ea.org": ["childrens-ministry"],
  "roz.galvez@cc-ea.org": ["childrens-ministry"],
  "drkentjt@yahoo.com": ["dental"],
  "katie.kinoshita@gmail.com": ["optometry"],
  "goclimbit@gmail.com": ["legal-services"],
  "vinson.lui@cc-ea.org": ["setup-team", "tear-down-team"],
  "rshimasaki@sbcglobal.net": ["photobooth"],
  "micirwin@yahoo.com": ["transportation-team"],
  "tony.gonzalesty@gmail.com": ["first-response"],
  // Vickie leads Volunteer Check-In (handpicked). She's also the coordinator
  // (ASSIGNERS) with full roster access; this grants her that area's board.
  "vickie.wright@cc-ea.org": ["volunteer-check-in"],
  // Pastor Jim also leads Janitorial, and Scott leads Emergency Response, but both
  // are ADMINs (post anywhere) already.
};

/* Who can use the roster to make area assignments: the four admins + Vickie,
   who runs volunteer placement. */
export const ASSIGNERS = ["vickie.wright@cc-ea.org"];

/* Shelter liaisons maintain the public Guest RSVP counter (sign-ups tracked at
   the shelters, outside this system). They can sign in and edit that number, but
   nothing else — they are NOT roster assigners. */
export const GUEST_LIAISONS = ["micirwin@yahoo.com"]; // Michael Irwin — Shelter Liaison

const lc = (s) => String(s || "").toLowerCase();
const isAdmin = (email) => ADMINS.map(lc).includes(lc(email));

/* One of the four overseers? (Exported for admin-only actions like sending
   leader onboarding — distinct from canAssign, which also includes Vickie.) */
export const isOverseer = (email) => isAdmin(email);

/* Returns the area ids this email may edit, or "*" for admins.
   Returns [] for anyone unrecognized. */
export function areasFor(email) {
  if (isAdmin(email)) return "*";
  return OWNERS[lc(email)] || [];
}

export function canEdit(email, areaId) {
  const allowed = areasFor(email);
  return allowed === "*" || allowed.includes(areaId);
}

/* Board posting scope: "*" for admins (any area + all-areas), else the area
   leader's own area ids, else [] (no board access). */
export function postScope(email) {
  if (isAdmin(email)) return "*";
  return AREA_LEADERS[lc(email)] || [];
}

/* May this email post to this board? areaId null/"" means an all-areas post,
   which only admins may do. Leaders are limited to their own area(s). */
export function canPostToArea(email, areaId) {
  const scope = postScope(email);
  if (scope === "*") return true;
  return Boolean(areaId) && scope.includes(areaId);
}

/* May this email make roster assignments (assign areas, edit/delete people)?
   Admins + designated assigners. This is the "can mutate the roster" gate. */
export function canAssign(email) {
  return isAdmin(email) || ASSIGNERS.map(lc).includes(lc(email));
}

/* Read scope for the Directory/roster: "*" for admins & assigners (everyone),
   else an area leader's own area ids (they see only their team), else [] (none).
   Area leaders get a *view* of their area — mutation stays behind canAssign. */
export function rosterScope(email) {
  if (canAssign(email)) return "*";
  const areas = AREA_LEADERS[lc(email)];
  return areas ? areas.slice() : [];
}

/* May this email open the Directory at all (any scope)? */
export function canViewRoster(email) {
  const scope = rosterScope(email);
  return scope === "*" || scope.length > 0;
}

/* Is this a dedicated shelter liaison (guest-RSVP keeper)? */
export function isGuestLiaison(email) {
  return GUEST_LIAISONS.map(lc).includes(lc(email));
}

/* May this email set the public Guest RSVP number? Admins/coordinator can; so can
   the shelter liaison(s) whose sole job is tracking those sign-ups. */
export function canEditGuestCount(email) {
  return canAssign(email) || isGuestLiaison(email);
}

/* Is this a recognized account (any role)? Gates who may request a login code. */
export function isKnownUser(email) {
  const e = lc(email);
  return isAdmin(e) || canAssign(e) || Boolean(AREA_LEADERS[e]) || isGuestLiaison(e);
}
