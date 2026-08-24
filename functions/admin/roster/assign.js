/* POST /admin/roster/assign  {volunteerId, areaId, areaName}
   Assigns a volunteer to an area, mints their team-portal token, and fires
   wave 2 (onboarding email + SMS-with-consent). Admin-only. */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { canAssign } from "../../_shared/owners.js";
import { assignArea, recordMessage } from "../../_shared/roster.js";
import { sendSms, sendEmail } from "../../_shared/notify.js";
import { onboarding } from "../../_shared/messages.js";

const SITE = "https://blessfest-2026.pages.dev";

export async function onRequestPost({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  if (!email || !canAssign(email)) return json({ error: "not authorized" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const volunteerId = Number(body.volunteerId);
  const areaId = String(body.areaId || "").trim();
  const areaName = String(body.areaName || areaId).trim();
  const shift = String(body.shift || "").trim(); // '1'/'2' to set, else leave as-is
  if (!volunteerId || !areaId) return json({ error: "volunteerId and areaId required" }, 400);

  const now = new Date().toISOString();
  const token = crypto.randomUUID().replace(/-/g, "");
  const { volunteer, token: tok } = await assignArea(env, {
    volunteerId, areaId, assignedBy: email, now, token, shift,
  });
  if (!volunteer) return json({ error: "volunteer not found" }, 404);

  const portalUrl = `${SITE}/team/${tok}`;
  const results = {};

  if (volunteer.email) {
    const e = onboarding.email({ firstName: volunteer.first_name, areaName, shift: volunteer.shift, portalUrl });
    const r = await safe(() => sendEmail(env, { to: volunteer.email, subject: e.subject, html: e.html, text: e.text }));
    await recordMessage(env, {
      volunteerId, wave: "onboarding", channel: "email", toAddr: volunteer.email,
      status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
    });
    results.email = r.status;
  }

  if (volunteer.phone && volunteer.sms_consent) {
    const r = await safe(() => sendSms(env, { to: volunteer.phone, body: onboarding.sms({ firstName: volunteer.first_name, lastName: volunteer.last_name, areaName, shift: volunteer.shift, portalUrl }) }));
    await recordMessage(env, {
      volunteerId, wave: "onboarding", channel: "sms", toAddr: volunteer.phone,
      status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
    });
    results.sms = r.status;
  }

  return json({ ok: true, volunteerId, areaId, portalUrl, sent: results });
}

const safe = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    return { status: "failed", error: String(e).slice(0, 200) };
  }
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
