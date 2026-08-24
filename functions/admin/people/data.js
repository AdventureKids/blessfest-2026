/* GET /admin/people/data — everyone in the roster (volunteers + area leaders)
   for the Directory page: filter, search, CSV, and texting. Admin/assigner only. */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { canAssign, canViewRoster, rosterScope } from "../../_shared/owners.js";
import { listVolunteers } from "../../_shared/roster.js";
import { isMinorFromRaw } from "../../_shared/intake.js";

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  if (!email || !canViewRoster(email)) return json({ error: "not authorized" }, 403);

  // Area leaders see only their own team (assigned to their area). Admins &
  // assigners ("*") see everyone.
  const scope = rosterScope(email);
  let rows = await listVolunteers(env);
  if (scope !== "*") {
    // Area leaders see only their own team — and Event Leads (oversight) don't
    // belong on an area roster, so drop them from the scoped view.
    const mine = new Set(scope);
    rows = rows.filter((v) => v.area_id && mine.has(v.area_id) && v.staff_role !== "Event Lead");
  }

  // Group rows into one entry per PERSON so someone leading (or serving in)
  // multiple areas shows once with every area listed. We key on NAME, not email
  // or phone: families register loved ones under one shared email/phone, so those
  // would wrongly merge distinct people — but the same name across rows is the
  // same person (e.g. Vinson leading Setup + Tear Down).
  const groups = new Map();
  for (const v of rows) {
    const key =
      (String(v.first_name || "") + " " + String(v.last_name || ""))
        .toLowerCase().replace(/\s+/g, " ").trim() || `id:${v.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: v.id, // primary row — used for texting/reassign
        ids: [], // every underlying row — used for delete
        firstName: v.first_name,
        lastName: v.last_name,
        email: v.email,
        phone: v.phone,
        smsConsent: !!v.sms_consent,
        role: v.staff_role || "", // "Area Leader" / "Event Lead" / "" (volunteer)
        areaIds: [], // all areas this person is in
        shifts: [], // per-shift detail: {shift, areaId, choice1, choice2}
        minor: false, // under-18 flag (from the Age Group answer) — for supervision
        note: v.note || "", // coordinator's note about this person
        createdAt: v.created_at,
        lastLoginAt: v.last_login_at || null, // latest backend sign-in across their rows
      });
    }
    const g = groups.get(key);
    g.ids.push(v.id);
    // ISO strings sort chronologically, so keep the most recent login.
    if (v.last_login_at && (!g.lastLoginAt || v.last_login_at > g.lastLoginAt)) g.lastLoginAt = v.last_login_at;
    if (v.area_id && !g.areaIds.includes(v.area_id)) g.areaIds.push(v.area_id);
    if (v.sms_consent) g.smsConsent = true;
    if (!g.role && v.staff_role) g.role = v.staff_role;
    if (!g.email && v.email) g.email = v.email;
    if (!g.phone && v.phone) g.phone = v.phone;
    // One entry per shift row (each shift is assigned separately).
    g.shifts.push({ shift: v.shift || null, areaId: v.area_id || null, choice1: v.choice1 || null, choice2: v.choice2 || null });
    // Flag minors (from the Age Group answer) so leaders/admins can spot them.
    if (!g.minor && isMinorFromRaw(v.raw_json)) g.minor = true;
    if (v.note && !g.note) g.note = v.note;
  }
  // Order each person's shifts (1, then 2, then unshifted) for stable display.
  const people = [...groups.values()].map((g) => {
    g.shifts.sort((a, b) => String(a.shift || "9").localeCompare(String(b.shift || "9")));
    return g;
  });
  // Leadership floats to the top: Event Leads first, then the Coordinator, then
  // everyone else in their existing order (stable sort keeps that intact).
  const rank = (p) => (p.role === "Event Lead" ? 0 : p.role === "Volunteer Coordinator" ? 1 : 2);
  people.sort((a, b) => rank(a) - rank(b));
  // canEdit gates the reassign/delete UI; scoped hides admin-only chrome.
  return json({ me: email, people, canEdit: canAssign(email), scoped: scope !== "*" });
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
