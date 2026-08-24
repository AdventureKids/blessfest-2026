/* GET /api/staff-photos — uploaded headshots for the Event Team leadership,
   keyed by lowercased email (Event Leads + Coordinator who set a photo via the
   "My Photo" page). The team page prefers these over the static image files, so
   a leader can self-update their card. Photos are public on that page anyway. */

export async function onRequestGet({ env }) {
  const out = {};
  try {
    const { results } = await env.ROSTER.prepare(
      `SELECT lower(email) AS e, photo FROM volunteers
        WHERE staff_role IN ('Event Lead', 'Volunteer Coordinator')
          AND photo IS NOT NULL AND email IS NOT NULL`,
    ).all();
    for (const r of results) if (r.e && r.photo) out[r.e] = r.photo;
  } catch { /* best-effort */ }

  return new Response(JSON.stringify(out), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
  });
}
