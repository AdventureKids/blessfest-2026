/* POST /admin/leaders/onboard — send (or preview) onboarding to staff on the
   roster: Area Leaders, Event Leads, and the Volunteer Coordinator. Each gets a
   role-appropriate email (area lead -> their team page; event lead -> the admin
   dashboard; coordinator -> Queue + Directory), plus a tap-to-activate link for
   texts. Overseers only.
     {mode:"preview"}      -> recipient list + a sample email. Sends nothing.
     {mode:"send", ids?}   -> emails the chosen staff (or all), texts area leaders
                              with a phone + consent. Idempotent per person. */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { isOverseer } from "../../_shared/owners.js";
import { recordMessage, ensureToken } from "../../_shared/roster.js";
import { sendSms, sendEmail } from "../../_shared/notify.js";
import { leaderWelcome, eventLeadWelcome, coordinatorWelcome } from "../../_shared/messages.js";
import { areaName as areaNameFor } from "../../_shared/areas.js";

const SITE = "https://blessfest-2026.pages.dev";
const TEAM_URL = `${SITE}/admin/team`;
const DIRECTORY_URL = `${SITE}/admin/people`;
const QUEUE_URL = `${SITE}/admin/roster`;
const activateUrlFor = (token) => `${SITE}/leader/activate/${token}`;

/* Build the right onboarding email for a staff member's role. */
function emailForRole(person, activateUrl) {
  if (person.role === "Event Lead") {
    return eventLeadWelcome.email({ firstName: person.firstName, email: person.email, activateUrl, adminUrl: DIRECTORY_URL });
  }
  if (person.role === "Volunteer Coordinator") {
    return coordinatorWelcome.email({ firstName: person.firstName, email: person.email, activateUrl, queueUrl: QUEUE_URL, directoryUrl: DIRECTORY_URL });
  }
  return leaderWelcome.email({ firstName: person.firstName, email: person.email, areaLabel: labelFor(person.areaIds), activateUrl, teamUrl: TEAM_URL });
}

export async function onRequestPost({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  if (!email || !isOverseer(email)) return json({ error: "not authorized" }, 403);

  let body = {};
  try {
    body = await request.json();
  } catch { /* default preview */ }
  const mode = String(body.mode || "preview");
  const onlyIds = Array.isArray(body.ids) ? body.ids.map(Number).filter(Boolean) : null;

  // All onboardable staff. Group by email so a person over several rows/areas
  // gets one message; keep their first staff role and every area.
  const { results } = await env.ROSTER.prepare(
    `SELECT id, first_name, last_name, email, phone, sms_consent, area_id, staff_role
       FROM volunteers
      WHERE staff_role IN ('Area Leader', 'Event Lead', 'Volunteer Coordinator')
      ORDER BY (staff_role = 'Event Lead') DESC, (staff_role = 'Volunteer Coordinator') DESC, first_name`,
  ).all();

  const byEmail = new Map();
  for (const r of results) {
    const key = String(r.email || "").toLowerCase();
    if (!key) continue;
    if (!byEmail.has(key)) {
      byEmail.set(key, {
        id: r.id, email: r.email, firstName: r.first_name, lastName: r.last_name,
        phone: r.phone, smsConsent: !!r.sms_consent, role: r.staff_role, areaIds: [],
      });
    }
    if (r.area_id) byEmail.get(key).areaIds.push(r.area_id);
  }
  const people = [...byEmail.values()];

  if (mode === "preview") {
    const recipients = people.map((p) => ({
      id: p.id,
      name: [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email,
      email: p.email,
      role: p.role,
      areas: p.areaIds.map(areaNameFor),
      willEmail: Boolean(p.email),
      willText: Boolean(p.phone && p.smsConsent),
    }));
    const first = people[0];
    const sample = first ? emailForRole(first, activateUrlFor("your-personal-link")) : null;
    return json({
      ok: true, mode: "preview", count: recipients.length, recipients,
      sample: sample ? { subject: sample.subject, text: sample.text } : null,
    });
  }

  if (mode === "send") {
    const now = new Date().toISOString();
    const targets = onlyIds ? people.filter((p) => onlyIds.includes(p.id)) : people;
    let emailed = 0, texted = 0, failed = 0, skipped = 0;
    for (const p of targets) {
      const activateUrl = activateUrlFor(await ensureToken(env, p.id, now));
      if (p.email) {
        const e = emailForRole(p, activateUrl);
        const r = await safe(() => sendEmail(env, { to: p.email, subject: e.subject, html: e.html, text: e.text }));
        const logged = await recordMessage(env, {
          volunteerId: p.id, wave: "staff-welcome", channel: "email", toAddr: p.email,
          status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
        });
        if (!logged) skipped++;
        else if (r.status === "sent") emailed++;
        else failed++;
      }
      // SMS only for area leaders (their text names their area). Others activate
      // via the link in their email.
      if (p.role === "Area Leader" && p.phone && p.smsConsent) {
        const smsBody = leaderWelcome.sms({ firstName: p.firstName, lastName: p.lastName, areaLabel: labelFor(p.areaIds), adminUrl: TEAM_URL });
        const r = await safe(() => sendSms(env, { to: p.phone, body: smsBody }));
        const logged = await recordMessage(env, {
          volunteerId: p.id, wave: "staff-welcome", channel: "sms", toAddr: p.phone,
          status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
        });
        if (logged && r.status === "sent") texted++;
      }
    }
    return json({ ok: true, mode: "send", emailed, texted, failed, skipped });
  }

  return json({ error: "unknown mode" }, 400);
}

const labelFor = (areaIds) => {
  const names = areaIds.map(areaNameFor);
  if (names.length <= 1) return names[0] || "your area";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
};
const safe = async (fn) => {
  try { return await fn(); } catch (e) { return { status: "failed", error: String(e).slice(0, 200) }; }
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
