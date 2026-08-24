/* D1 helpers for the volunteer roster. All timestamps are ISO8601 strings
   passed in by the caller (Workers have Date; kept explicit for testability). */

import { isShift } from "./shifts.js";

/* Insert a volunteer, or return the existing one if this submission was already
   processed (Formstack retries webhooks). Idempotent on submission_id. */
export async function upsertVolunteer(env, v) {
  if (v.submissionId) {
    const existing = await env.ROSTER.prepare(
      "SELECT * FROM volunteers WHERE submission_id = ?",
    )
      .bind(v.submissionId)
      .first();
    if (existing) return { volunteer: existing, created: false };
  }

  const res = await env.ROSTER.prepare(
    `INSERT INTO volunteers
       (submission_id, first_name, last_name, email, phone, sms_consent, choice1, choice2, shift, raw_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
  )
    .bind(
      v.submissionId || null,
      v.firstName,
      v.lastName || null,
      v.email || null,
      v.phone || null,
      v.smsConsent ? 1 : 0,
      v.choice1 || null,
      v.choice2 || null,
      v.shift || null,
      v.rawJson || null,
      v.createdAt,
    )
    .first();

  return { volunteer: res, created: true };
}

/* Record a send attempt. Returns false if this (volunteer, wave, channel) was
   already logged — the UNIQUE constraint prevents double-sends on retry. */
export async function recordMessage(env, m) {
  try {
    await env.ROSTER.prepare(
      `INSERT INTO messages
         (volunteer_id, wave, channel, to_addr, status, provider_id, error, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        m.volunteerId,
        m.wave,
        m.channel,
        m.toAddr || "",
        m.status,
        m.providerId || null,
        m.error || null,
        m.createdAt,
      )
      .run();
    return true;
  } catch (e) {
    if (String(e).includes("UNIQUE")) return false; // already sent
    throw e;
  }
}

/* List volunteers for the admin roster, newest first, unassigned surfaced. */
export async function listVolunteers(env) {
  const { results } = await env.ROSTER.prepare(
    `SELECT v.*, t.token
       FROM volunteers v
       LEFT JOIN tokens t ON t.volunteer_id = v.id AND t.revoked_at IS NULL
       ORDER BY (v.area_id IS NOT NULL), v.created_at DESC`,
  ).all();
  return results;
}

/* Assign an area, mint a portal token (once), and stamp who/when. Returns the
   volunteer plus token. Idempotent-ish: re-assigning updates area, reuses token. */
export async function assignArea(env, { volunteerId, areaId, assignedBy, now, token, shift }) {
  // Set the shift too when the caller passes a valid one ('1'/'2'); otherwise
  // leave whatever shift the volunteer already had (e.g. from registration).
  if (isShift(shift)) {
    await env.ROSTER.prepare(
      "UPDATE volunteers SET area_id = ?, shift = ?, assigned_at = ?, assigned_by = ? WHERE id = ?",
    )
      .bind(areaId, shift, now, assignedBy, volunteerId)
      .run();
  } else {
    await env.ROSTER.prepare(
      "UPDATE volunteers SET area_id = ?, assigned_at = ?, assigned_by = ? WHERE id = ?",
    )
      .bind(areaId, now, assignedBy, volunteerId)
      .run();
  }

  const existing = await env.ROSTER.prepare(
    "SELECT token FROM tokens WHERE volunteer_id = ? AND revoked_at IS NULL",
  )
    .bind(volunteerId)
    .first();

  let tok = existing?.token;
  if (!tok) {
    tok = token;
    await env.ROSTER.prepare(
      "INSERT INTO tokens (token, volunteer_id, created_at) VALUES (?, ?, ?)",
    )
      .bind(tok, volunteerId, now)
      .run();
  }

  const volunteer = await env.ROSTER.prepare("SELECT * FROM volunteers WHERE id = ?")
    .bind(volunteerId)
    .first();
  return { volunteer, token: tok };
}

/* Fetch one volunteer by id (or null). */
export async function getVolunteer(env, id) {
  return env.ROSTER.prepare("SELECT * FROM volunteers WHERE id = ?").bind(id).first();
}

/* Return this person's live portal/activation token, minting one if they don't
   have an unrevoked one yet. Stable across calls so emailed links keep working. */
export async function ensureToken(env, volunteerId, now) {
  const existing = await env.ROSTER.prepare(
    "SELECT token FROM tokens WHERE volunteer_id = ? AND revoked_at IS NULL",
  )
    .bind(volunteerId)
    .first();
  if (existing?.token) return existing.token;
  const tok = crypto.randomUUID().replace(/-/g, "");
  await env.ROSTER.prepare(
    "INSERT INTO tokens (token, volunteer_id, created_at) VALUES (?, ?, ?)",
  )
    .bind(tok, volunteerId, now)
    .run();
  return tok;
}

/* Set a person's mobile number and turn on SMS consent (used by leader
   self-activation). Optionally store a headshot (small JPEG data URL); pass
   photo === undefined to leave any existing photo untouched. Returns the row. */
export async function setPhoneConsent(env, id, phone, now, photo) {
  if (photo !== undefined) {
    await env.ROSTER.prepare(
      "UPDATE volunteers SET phone = ?, sms_consent = 1, photo = ? WHERE id = ?",
    )
      .bind(phone, photo, id)
      .run();
  } else {
    await env.ROSTER.prepare(
      "UPDATE volunteers SET phone = ?, sms_consent = 1 WHERE id = ?",
    )
      .bind(phone, id)
      .run();
  }
  return getVolunteer(env, id);
}

/* The headshot for a set of lead emails (the area's named lead in leads.js), or
   null. Matching by EMAIL — not just "any staff in the area" — ensures the photo
   always belongs to the person whose name is shown. */
export async function leaderPhotoForEmails(env, emails) {
  const list = (emails || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  if (!list.length) return null;
  const ph = list.map(() => "?").join(",");
  const row = await env.ROSTER.prepare(
    `SELECT photo FROM volunteers WHERE lower(email) IN (${ph}) AND photo IS NOT NULL LIMIT 1`,
  )
    .bind(...list)
    .first();
  return row?.photo || null;
}

/* Remove a volunteer and everything that points at them. D1 doesn't enforce
   foreign keys by default, so we clear child rows (messages, tokens) ourselves
   to avoid orphans. Portal links are revoked by deletion. */
export async function deleteVolunteer(env, id) {
  await env.ROSTER.batch([
    env.ROSTER.prepare("DELETE FROM messages WHERE volunteer_id = ?").bind(id),
    env.ROSTER.prepare("DELETE FROM tokens WHERE volunteer_id = ?").bind(id),
    env.ROSTER.prepare("DELETE FROM volunteers WHERE id = ?").bind(id),
  ]);
}

/* Has this volunteer already been sent this wave on this channel? */
export async function alreadySent(env, volunteerId, wave, channel) {
  const row = await env.ROSTER.prepare(
    "SELECT 1 FROM messages WHERE volunteer_id = ? AND wave = ? AND channel = ? AND status IN ('sent','skipped')",
  )
    .bind(volunteerId, wave, channel)
    .first();
  return Boolean(row);
}
