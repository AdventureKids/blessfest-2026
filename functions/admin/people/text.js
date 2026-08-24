/* POST /admin/people/text  { volunteerIds: [...], body }
   Send an SMS to selected people. Only those who opted in (sms_consent) AND have
   a phone are texted; the rest are reported back as skipped. Admin/assigner only. */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { canViewRoster, rosterScope } from "../../_shared/owners.js";
import { recordMessage } from "../../_shared/roster.js";
import { sendSms } from "../../_shared/notify.js";
import { smsFor } from "../../_shared/messages.js";

const MAX_LEN = 1000;

export async function onRequestPost({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  if (!email || !canViewRoster(email)) return json({ error: "not authorized" }, 403);

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const ids = Array.isArray(b.volunteerIds) ? b.volunteerIds.map(Number).filter(Boolean) : [];
  const body = String(b.body || "").trim();
  if (!ids.length) return json({ error: "no recipients selected" }, 400);
  if (!body) return json({ error: "message is empty" }, 400);
  if (body.length > MAX_LEN) return json({ error: `message too long (max ${MAX_LEN})` }, 400);

  const now = new Date().toISOString();
  const placeholders = ids.map(() => "?").join(",");
  const { results } = await env.ROSTER.prepare(
    `SELECT id, first_name, last_name, phone, sms_consent, area_id FROM volunteers WHERE id IN (${placeholders})`,
  )
    .bind(...ids)
    .all();

  // Area leaders may only text people on their own team; drop anyone else.
  const scope = rosterScope(email);
  const inScope = (v) =>
    scope === "*" || (v.area_id && Array.isArray(scope) && scope.includes(v.area_id));

  let sent = 0, noConsent = 0, noPhone = 0, failed = 0, offTeam = 0;
  for (const v of results) {
    if (!inScope(v)) { offTeam++; continue; }
    if (!v.sms_consent) { noConsent++; continue; }
    if (!v.phone) { noPhone++; continue; }
    const msg = smsFor(
      { firstName: v.first_name, lastName: v.last_name },
      `${body}\n\n— BlessFest. Reply STOP to opt out.`,
    );
    const r = await safe(() => sendSms(env, { to: v.phone, body: msg }));
    await recordMessage(env, {
      volunteerId: v.id, wave: `direct:${now}`, channel: "sms", toAddr: v.phone,
      status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
    });
    if (r.status === "sent") sent++; else failed++;
  }

  return json({ ok: true, sent, noConsent, noPhone, failed, offTeam, requested: ids.length });
}

const safe = async (fn) => {
  try { return await fn(); } catch (e) { return { status: "failed", error: String(e).slice(0, 200) }; }
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
