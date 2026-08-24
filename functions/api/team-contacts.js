/* GET /api/team-contacts — phone numbers for the event-team page, keyed by
   lowercased email (Event Leads + Coordinator who have a number on file).

   BACKEND-ONLY: phones are returned only to a signed-in staff/leader. A public
   visitor (no session) gets an empty object, so the public "Meet the team" page
   shows email icons only, while a logged-in leader also sees the phone icons.
   Email itself is public (it's already printed on the page). */

import { identify, AuthUnavailable } from "../_shared/auth.js";
import { isKnownUser } from "../_shared/owners.js";

export async function onRequestGet({ request, env }) {
  let email = null;
  try {
    email = await identify(request, env);
  } catch (e) {
    if (!(e instanceof AuthUnavailable)) throw e; // misconfig -> treat as not signed in
  }
  if (!email || !isKnownUser(email)) return json({}); // public: no phone numbers

  const out = {};
  try {
    const { results } = await env.ROSTER.prepare(
      `SELECT email, phone FROM volunteers
        WHERE staff_role IN ('Event Lead', 'Volunteer Coordinator')
          AND phone IS NOT NULL AND email IS NOT NULL`,
    ).all();
    for (const r of results) {
      const key = String(r.email).trim().toLowerCase();
      if (key && r.phone) out[key] = r.phone;
    }
  } catch { /* return {} on DB error */ }
  return json(out);
}

// Auth-dependent, so never cache it in a shared cache.
const json = (obj) =>
  new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
