/* GET /api/stats — public live counts for the homepage.
   volunteers: distinct people on the roster (deduped by name so a two-shift
   signup counts once; includes leadership).
   guests: a manually-maintained number (guests sign up at the shelters, outside
   this system), stored in KV and set from /admin/stats. */

export async function onRequestGet({ env }) {
  let volunteers = 0;
  try {
    const row = await env.ROSTER.prepare(
      `SELECT COUNT(*) AS n FROM (
         SELECT DISTINCT lower(trim(coalesce(first_name,'') || '|' || coalesce(last_name,'')))
           FROM volunteers
       )`,
    ).first();
    volunteers = Number(row?.n || 0);
  } catch { /* leave 0 if the DB is unavailable */ }

  let guests = 0;
  try {
    guests = Number((await env.CONTENT.get("guest_count")) || 0) || 0;
  } catch { /* leave 0 */ }

  return new Response(JSON.stringify({ volunteers, guests }), {
    headers: {
      "content-type": "application/json",
      // Short cache so the number feels live without hammering D1.
      "cache-control": "public, max-age=30",
    },
  });
}
