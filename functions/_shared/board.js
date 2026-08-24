/* Message-board + token helpers for the team portal. */

/* Resolve a portal token to its volunteer (with area). Returns null if the
   token is unknown or revoked. Stamps last_used_at as a side effect. */
export async function volunteerByToken(env, token, now) {
  if (!token) return null;
  const row = await env.ROSTER.prepare(
    `SELECT v.*, t.token, t.revoked_at
       FROM tokens t JOIN volunteers v ON v.id = t.volunteer_id
      WHERE t.token = ?`,
  )
    .bind(token)
    .first();
  if (!row || row.revoked_at) return null;
  await env.ROSTER.prepare("UPDATE tokens SET last_used_at = ? WHERE token = ?").bind(now, token).run();
  return row;
}

/* Posts an area's volunteers should see: that area's posts plus global ones
   (area_id IS NULL). Pinned first, then newest. */
export async function postsForArea(env, areaId) {
  const { results } = await env.ROSTER.prepare(
    `SELECT * FROM posts
      WHERE area_id = ? OR area_id IS NULL
      ORDER BY pinned DESC, created_at DESC`,
  )
    .bind(areaId)
    .all();
  return results;
}

export async function createPost(env, { areaId, author, body, pinned, now }) {
  const res = await env.ROSTER.prepare(
    `INSERT INTO posts (area_id, author, body, pinned, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *`,
  )
    .bind(areaId || null, author, body, pinned ? 1 : 0, now)
    .first();
  return res;
}

export async function setPinned(env, id, pinned) {
  await env.ROSTER.prepare("UPDATE posts SET pinned = ? WHERE id = ?").bind(pinned ? 1 : 0, id).run();
}

export async function deletePost(env, id) {
  await env.ROSTER.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
}

/* Edit an existing announcement's text (and optionally its pinned state). */
export async function updatePost(env, id, { body, pinned }) {
  if (pinned === undefined) {
    await env.ROSTER.prepare("UPDATE posts SET body = ? WHERE id = ?").bind(body, id).run();
  } else {
    await env.ROSTER.prepare("UPDATE posts SET body = ?, pinned = ? WHERE id = ?").bind(body, pinned ? 1 : 0, id).run();
  }
}

/* All posts for the admin board view, grouped-friendly (newest first). */
export async function allPosts(env) {
  const { results } = await env.ROSTER.prepare(
    "SELECT * FROM posts ORDER BY pinned DESC, created_at DESC",
  ).all();
  return results;
}

export const getPost = (env, id) =>
  env.ROSTER.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first();

/* Assigned volunteers of an area (or everyone assigned, if areaId is null) who
   can be texted — have a phone, consented, and a portal token. */
/* Volunteers who should receive an announcement EMAIL: assigned to the area and
   have an email. No SMS-consent gate (email isn't SMS), and the author is
   excluded so a leader doesn't email themselves their own post. */
export async function emailableVolunteers(env, areaId, excludeEmail) {
  const params = [];
  const where = ["v.email IS NOT NULL", "v.email != ''"];
  if (areaId) { where.push("v.area_id = ?"); params.push(areaId); }
  else { where.push("v.area_id IS NOT NULL"); }
  if (excludeEmail) { where.push("lower(v.email) != ?"); params.push(String(excludeEmail).toLowerCase()); }
  const sql = `SELECT v.id, v.first_name, v.last_name, v.email, t.token
       FROM volunteers v
       JOIN tokens t ON t.volunteer_id = v.id AND t.revoked_at IS NULL
      WHERE ${where.join(" AND ")}`;
  const { results } = await env.ROSTER.prepare(sql).bind(...params).all();
  return results;
}

export async function textableVolunteers(env, areaId) {
  const sql = areaId
    ? `SELECT v.id, v.first_name, v.last_name, v.phone, t.token FROM volunteers v
         JOIN tokens t ON t.volunteer_id = v.id AND t.revoked_at IS NULL
        WHERE v.area_id = ? AND v.phone IS NOT NULL AND v.sms_consent = 1`
    : `SELECT v.id, v.first_name, v.last_name, v.phone, t.token FROM volunteers v
         JOIN tokens t ON t.volunteer_id = v.id AND t.revoked_at IS NULL
        WHERE v.area_id IS NOT NULL AND v.phone IS NOT NULL AND v.sms_consent = 1`;
  const stmt = env.ROSTER.prepare(sql);
  const { results } = await (areaId ? stmt.bind(areaId) : stmt).all();
  return results;
}

/* Assigned members of an area for the team roster. Staff Leadership first, then
   volunteers by first name. Names + shift (so the portal can group by shift). */
export async function teamMembers(env, areaId) {
  // Event Leads oversee the whole event, so they don't appear on an area roster.
  const { results } = await env.ROSTER.prepare(
    `SELECT first_name, last_name, staff_role, shift FROM volunteers
      WHERE area_id = ? AND (staff_role IS NULL OR staff_role != 'Event Lead')
      ORDER BY (staff_role IS NULL), first_name`,
  )
    .bind(areaId)
    .all();
  return results;
}
