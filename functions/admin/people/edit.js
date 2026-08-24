/* POST /admin/people/edit — edit one person from the Directory. Admin/assigner
   only (canAssign). Actions:
     {action:"reassign", volunteerId, areaId, areaName}
        Move them to a different area, keep their portal token, and re-fire the
        onboarding email + SMS (with consent) so they get the new team's info.
     {action:"delete", volunteerId}
        Remove them and their tokens/messages entirely.
   Reassigning a staff row (area leader) only moves their area; use with care. */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { canAssign } from "../../_shared/owners.js";
import { getVolunteer, deleteVolunteer, assignArea, recordMessage } from "../../_shared/roster.js";
import { sendSms, sendEmail } from "../../_shared/notify.js";
import { onboarding } from "../../_shared/messages.js";
import { areaName as areaNameFor } from "../../_shared/areas.js";

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

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const volunteerId = Number(b.volunteerId);
  if (!volunteerId) return json({ error: "volunteerId required" }, 400);

  const existing = await getVolunteer(env, volunteerId);
  if (!existing) return json({ error: "person not found" }, 404);

  if (b.action === "note") {
    // A coordinator note about the person — store it on every row they have
    // (matched by name, like the Directory grouping) so it shows regardless of
    // which shift-row is displayed.
    const note = (b.note == null ? "" : String(b.note)).trim().slice(0, 2000);
    const fn = String(existing.first_name || "").toLowerCase().trim();
    const ln = String(existing.last_name || "").toLowerCase().trim();
    await env.ROSTER.prepare(
      "UPDATE volunteers SET note = ? WHERE lower(trim(coalesce(first_name,''))) = ? AND lower(trim(coalesce(last_name,''))) = ?",
    ).bind(note || null, fn, ln).run();
    return json({ ok: true, note });
  }

  if (b.action === "delete") {
    // A person may span several rows (e.g. multi-area leader). Delete them all.
    const ids = Array.isArray(b.ids) && b.ids.length ? b.ids.map(Number).filter(Boolean) : [volunteerId];
    for (const id of ids) await deleteVolunteer(env, id);
    return json({ ok: true, deleted: ids });
  }

  if (b.action === "reassign") {
    const areaId = String(b.areaId || "").trim();
    if (!areaId) return json({ error: "areaId required" }, 400);
    const shift = String(b.shift || "").trim(); // '1'/'2' to set, else keep current
    if (areaId === existing.area_id && !shift) return json({ error: "already on that team" }, 400);
    const areaName = String(b.areaName || areaNameFor(areaId)).trim();

    const now = new Date().toISOString();
    const token = crypto.randomUUID().replace(/-/g, "");
    const { volunteer, token: tok } = await assignArea(env, {
      volunteerId, areaId, assignedBy: email, now, token, shift,
    });
    const portalUrl = `${SITE}/team/${tok}`;

    // Fire onboarding for the new area. Unique wave per reassignment so a genuine
    // move always sends (the "onboarding" wave is one-shot; "reassign:<ts>" isn't).
    const wave = `reassign:${now}`;
    const sent = {};
    if (volunteer.email) {
      const e = onboarding.email({ firstName: volunteer.first_name, areaName, shift: volunteer.shift, portalUrl });
      const r = await safe(() => sendEmail(env, { to: volunteer.email, subject: e.subject, html: e.html, text: e.text }));
      await recordMessage(env, {
        volunteerId, wave, channel: "email", toAddr: volunteer.email,
        status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
      });
      sent.email = r.status;
    }
    if (volunteer.phone && volunteer.sms_consent) {
      const body = onboarding.sms({ firstName: volunteer.first_name, lastName: volunteer.last_name, areaName, shift: volunteer.shift, portalUrl });
      const r = await safe(() => sendSms(env, { to: volunteer.phone, body }));
      await recordMessage(env, {
        volunteerId, wave, channel: "sms", toAddr: volunteer.phone,
        status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
      });
      sent.sms = r.status;
    }
    return json({ ok: true, volunteerId, areaId, areaName, portalUrl, sent });
  }

  return json({ error: "unknown action" }, 400);
}

const safe = async (fn) => {
  try { return await fn(); } catch (e) { return { status: "failed", error: String(e).slice(0, 200) }; }
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
