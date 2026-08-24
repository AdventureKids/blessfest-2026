/* GET /team/<token> — a volunteer's team portal. The token identifies the
   volunteer and their area server-side; we render a shell + boot data, and the
   client pulls the area's public copy from /data.js to fill in the details.

   Access is the bearer token itself (the link is the credential). Treated as
   semi-public: no secrets here, and leader contact is opt-in per area (leads.js).
   The rendering lives in _shared/portal.js, shared with the leader/admin preview. */

import { volunteerByToken } from "../_shared/board.js";
import { buildAreaBoot, portalPage } from "../_shared/portal.js";

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function onRequestGet({ params, env }) {
  const now = new Date().toISOString();
  const volunteer = await volunteerByToken(env, params.token, now);

  if (!volunteer) {
    return portalPage(
      { invalid: true },
      `<div class="card"><h1>This link isn't valid</h1>` +
        `<p>It may have expired or been mistyped. If you think this is a mistake, ` +
        `reply to your onboarding email and we'll sort it out.</p></div>`,
    );
  }
  if (!volunteer.area_id) {
    return portalPage(
      { pending: true, firstName: volunteer.first_name },
      `<div class="card"><h1>You're registered!</h1>` +
        `<p>Hi ${esc(volunteer.first_name)} — you're on the list. Our team is still ` +
        `assigning areas; you'll get another note the moment you're placed.</p></div>`,
    );
  }

  const boot = await buildAreaBoot(env, volunteer.area_id, volunteer.first_name);
  return portalPage(boot, null);
}
