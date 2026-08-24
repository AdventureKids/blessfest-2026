/* POST /api/formstack-webhook — Formstack calls this on every submission.

   It stores the volunteer in D1 and fires wave 1 (welcome SMS + email). It is
   idempotent: Formstack retries on non-2xx, so re-processing the same
   submission must not create duplicates or re-send. We always return 200 once
   the volunteer is stored, even if a send fails, so Formstack doesn't retry a
   partial success — failures are recorded in the messages table for retry.

   FIELD MAPPING: Formstack posts field values keyed by the form's field IDs or
   labels, which differ per form. `readField` tries several shapes; the exact
   mapping MUST be confirmed against the real 2026 form (see FIELD_MAP). */

import { upsertVolunteer, recordMessage } from "../_shared/roster.js";
import { sendSms, sendEmail, toE164 } from "../_shared/notify.js";
import { welcome } from "../_shared/messages.js";

/* Map our fields -> the labels/keys the form uses. Confirm against the live form
   (Formstack: form Settings → field labels, or inspect one real webhook body). */
const FIELD_MAP = {
  // Keys are matched AFTER trimming whitespace (Formstack has some like "Phone Number ").
  firstName: ["Name (First)", "First Name", "first_name"],
  lastName: ["Name (Last)", "Last Name", "last_name"],
  email: ["Email", "email"],
  phone: ["Phone Number", "Phone", "Cell Phone", "Mobile", "phone"],
  // Required Yes/No on the form. Consent = the value is exactly "Yes".
  smsConsent: ["Do we have permission to text you updates about your volunteer schedule assignment etc?"],
};

/* Area preference is asked per shift. A person may fill one shift or both; each
   shift they pick becomes its own volunteer row so it can be assigned + texted
   independently. Labels match the live form's shift wording. */
const SHIFT_FIELDS = {
  "1": {
    choice1: ["Service Area 6:45am to 10am - #1 Preference"],
    choice2: ["Service Area 6:45am to 10am - #2 Preference"],
  },
  "2": {
    choice1: ["Service Area 9:45am - 1:15pm - #1 Preference"],
    choice2: ["Service Area 9:45am - 1:15pm - #2 Preference"],
  },
};

// Formstack sends "None" for unselected dropdowns/radios — treat it as empty.
function readField(data, candidates) {
  for (const key of candidates) {
    const v = data[key];
    if (v == null) continue;
    const s = String(v).trim();
    if (s !== "" && s.toLowerCase() !== "none") return v;
  }
  return undefined;
}

/* Formstack can POST as form-urlencoded or JSON depending on config; and it may
   nest values. Flatten to a simple {key: value} we can look up by label. */
async function parseSubmission(request) {
  const ctype = request.headers.get("content-type") || "";
  let raw;
  if (ctype.includes("application/json")) {
    raw = await request.json();
  } else {
    const form = await request.formData();
    raw = Object.fromEntries([...form.entries()].map(([k, v]) => [k, v]));
  }

  // Formstack sometimes wraps the answers under FormData/data; merge to top level,
  // and trim keys (some arrive with trailing spaces, e.g. "Phone Number ").
  const merged = { ...raw, ...(raw.FormData || raw.data || {}) };
  const flat = Object.fromEntries(Object.entries(merged).map(([k, v]) => [String(k).trim(), v]));
  const submissionId =
    raw.UniqueID || raw.unique_id || raw.submission_id || raw.id || undefined;
  return { flat, submissionId, raw };
}

export async function onRequestPost({ request, env }) {
  // Shared-secret guard: Formstack can append ?key=… to the webhook URL. If
  // WEBHOOK_SECRET is set, require it, so randoms can't stuff our roster.
  if (env.WEBHOOK_SECRET) {
    const url = new URL(request.url);
    if (url.searchParams.get("key") !== env.WEBHOOK_SECRET) {
      return json({ error: "unauthorized" }, 401);
    }
  }

  let parsed;
  try {
    parsed = await parseSubmission(request);
  } catch {
    return json({ error: "could not parse submission" }, 400);
  }
  const { flat, submissionId, raw } = parsed;

  // First/last: prefer the split "Name (First)"/"Name (Last)" fields; otherwise
  // split a single combined "Name" value ("Christian Kopeny" -> first + last).
  let firstName = readField(flat, FIELD_MAP.firstName);
  let lastName = readField(flat, FIELD_MAP.lastName);
  if (!firstName) {
    const whole = readField(flat, ["Name", "Full Name", "name"]);
    if (whole) {
      const parts = String(whole).trim().split(/\s+/);
      firstName = parts.shift();
      lastName = lastName || (parts.length ? parts.join(" ") : undefined);
    }
  }
  if (!firstName) {
    // Nothing we can address a message to — log and 200 so Formstack stops retrying.
    console.log("[webhook] submission with no name; keys:", Object.keys(flat).join(","));
    return json({ ok: true, note: "no name on submission" });
  }

  const now = new Date().toISOString();
  const phone = toE164(readField(flat, FIELD_MAP.phone));
  // Consent is a required Yes/No — only "Yes" enables texting.
  const smsRaw = readField(flat, FIELD_MAP.smsConsent);
  const smsConsent = String(smsRaw || "").trim().toLowerCase() === "yes";
  const base = {
    firstName: String(firstName).trim(),
    lastName,
    email: readField(flat, FIELD_MAP.email),
    phone,
    smsConsent,
    rawJson: JSON.stringify(raw),
    createdAt: now,
  };

  // Which shift(s) did they pick? Each shift with an area preference becomes its
  // own row (idempotent per shift via a "<submission>#<shift>" id). If they
  // picked no area at all, still capture one row so they're on the list.
  const chosen = [];
  for (const s of ["1", "2"]) {
    const c1 = readField(flat, SHIFT_FIELDS[s].choice1);
    const c2 = readField(flat, SHIFT_FIELDS[s].choice2);
    if (c1 || c2) chosen.push({ shift: s, choice1: c1, choice2: c2 });
  }
  const rowsToMake = chosen.length ? chosen : [{ shift: null, choice1: undefined, choice2: undefined }];

  const results = [];
  for (const r of rowsToMake) {
    const subId = submissionId ? `${submissionId}#${r.shift || "0"}` : undefined;
    const { volunteer, created } = await upsertVolunteer(env, {
      ...base, submissionId: subId, shift: r.shift, choice1: r.choice1, choice2: r.choice2,
    });
    results.push({ volunteer, created, shift: r.shift });
  }

  // Send ONE welcome per signup (not per shift), listing the shift(s) they chose.
  // Only when at least one row was newly created (so retries don't re-text).
  const created = results.filter((x) => x.created);
  if (!created.length) {
    return json({ ok: true, duplicate: true, volunteerIds: results.map((x) => x.volunteer.id) });
  }
  const shifts = chosen.map((c) => c.shift);
  await sendWave1(env, created[0].volunteer, shifts, now);
  return json({ ok: true, volunteerIds: results.map((x) => x.volunteer.id), shifts });
}

/* Fire the welcome SMS (only with consent) and the welcome email. Each send is
   recorded; failures are logged rows, not thrown, so one bad channel doesn't
   sink the other or trigger a Formstack retry. */
async function sendWave1(env, v, shifts, now) {
  // SMS — only if we have a number AND they consented (A2P/TCPA requirement).
  if (v.phone && v.sms_consent) {
    const r = await safe(() => sendSms(env, { to: v.phone, body: welcome.sms({ firstName: v.first_name, lastName: v.last_name, shifts }) }));
    await recordMessage(env, {
      volunteerId: v.id, wave: "welcome", channel: "sms", toAddr: v.phone,
      status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
    });
  }

  // Email mirror of the same message.
  if (v.email) {
    const e = welcome.email({ firstName: v.first_name, shifts });
    const r = await safe(() => sendEmail(env, { to: v.email, subject: e.subject, html: e.html, text: e.text }));
    await recordMessage(env, {
      volunteerId: v.id, wave: "welcome", channel: "email", toAddr: v.email,
      status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
    });
  }
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
