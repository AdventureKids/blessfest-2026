/* Pull the "extra" answers out of a Formstack submission's raw_json — everything
   that ISN'T already a column we surface (name, email, phone, consent, the four
   shift/area preference fields). These are comments and professional-qualifier
   answers ("are you a licensed dentist?", dietary notes, etc.) that help place a
   volunteer, so they live on the assignment Queue. Label-matched, case-insensitive. */

const CORE_LABELS = new Set(
  [
    "Name (First)", "First Name", "Name (Last)", "Last Name", "Name", "Full Name",
    "Email", "Phone Number", "Phone", "Cell Phone", "Mobile",
    "Do we have permission to text you updates about your volunteer schedule assignment etc?",
    "Service Area 6:45am to 10am - #1 Preference", "Service Area 6:45am to 10am - #2 Preference",
    "Service Area 9:45am - 1:15pm - #1 Preference", "Service Area 9:45am - 1:15pm - #2 Preference",
  ].map((s) => s.toLowerCase()),
);
const META_KEY = /^(uniqueid|unique_id|submission_id|id|form_?id|handshake_key|status|_.*)$/i;
// The shift-selector field just repeats the shift column, so it's not an "extra".
const REDUNDANT = /^(select a shift|which shift|shift preference|service area)/i;

/* Is this submission a minor? Reads the form's "Age Group" answer (e.g.
   "Over 18" vs "Under 18"). Leaders/admins need to know for supervision. */
export function isMinorFromRaw(raw) {
  if (!raw) return false;
  let obj;
  try { obj = JSON.parse(raw); } catch { return false; }
  const merged = { ...obj, ...(obj.FormData || obj.data || {}) };
  for (const [k, v] of Object.entries(merged)) {
    if (/age\s*group|18 or older|are you .*18/i.test(String(k))) {
      const g = String(v || "").toLowerCase().trim();
      if (!g) continue;
      if (/over|18 (and|or) (over|older|up)|adult/.test(g)) return false;
      if (/under|1[0-7]\b|minor|youth|teen/.test(g)) return true;
    }
  }
  return false;
}

export function extrasFromRaw(raw) {
  if (!raw) return {};
  let obj;
  try { obj = JSON.parse(raw); } catch { return {}; }
  const merged = { ...obj, ...(obj.FormData || obj.data || {}) };
  const out = {};
  for (const [k, val] of Object.entries(merged)) {
    const label = String(k).trim();
    const low = label.toLowerCase();
    if (CORE_LABELS.has(low) || META_KEY.test(low) || REDUNDANT.test(label)) continue;
    if (val == null || typeof val === "object") continue;
    const s = String(val).trim();
    if (!s || s.toLowerCase() === "none") continue;
    out[label] = s;
  }
  return out;
}
