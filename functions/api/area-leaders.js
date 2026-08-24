/* GET /api/area-leaders — area leaders for the public "Meet the team" page,
   derived from leads.js. Returns [{ area, name, people: [{name, email, photo}] }].
   `people` has one entry per login email, so co-led areas (two emails) get two
   photo slots that each fill in as that leader uploads a headshot. Internal areas
   are excluded. Emails are intentionally public here. */

import { LEADS } from "../_shared/leads.js";
import { areaName } from "../_shared/areas.js";

const INTERNAL = new Set(["emergency-response", "volunteer-check-in"]);

export async function onRequestGet({ env }) {
  const areas = [];
  const allEmails = [];
  for (const [areaId, lead] of Object.entries(LEADS)) {
    if (INTERNAL.has(areaId)) continue;
    const emails = (lead.emails || []).map((e) => String(e).toLowerCase());
    // Split "A & B" into per-person names; only trust the split if it matches
    // the number of emails (e.g. "David & Sunny Barrs" share one login).
    const names = String(lead.name).split("&").map((s) => s.trim()).filter(Boolean);
    const paired = names.length === emails.length;
    // sharedPhoto: co-leads who submitted ONE photo of both — a single avatar,
    // but every email is still kept as a contact.
    const people = lead.sharedPhoto
      ? [{ name: lead.name, email: emails[0] || null, emails }]
      : emails.map((email, i) => ({ email, emails: [email], name: paired ? names[i] : lead.name }));
    areas.push({ area: areaName(areaId), name: lead.name, people });
    allEmails.push(...emails);
  }

  // One query for every leader's uploaded photo.
  const photoMap = {};
  const uniq = [...new Set(allEmails)];
  if (uniq.length) {
    try {
      const ph = uniq.map(() => "?").join(",");
      const { results } = await env.ROSTER.prepare(
        `SELECT lower(email) AS e, photo FROM volunteers WHERE lower(email) IN (${ph}) AND photo IS NOT NULL`,
      ).bind(...uniq).all();
      for (const r of results) if (r.e && r.photo) photoMap[r.e] = r.photo;
    } catch { /* photos are best-effort */ }
  }

  const out = areas
    .map((a) => ({ ...a, people: a.people.map((p) => ({ ...p, photo: (p.emails || [p.email]).map((e) => photoMap[e]).find(Boolean) || null })) }))
    .sort((a, b) => a.area.localeCompare(b.area));

  return new Response(JSON.stringify(out), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
  });
}
