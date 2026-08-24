/* SMS (Twilio) and email (Resend) senders.

   Both are written so the pipeline WORKS end-to-end before any account exists:
   if the relevant env vars are missing, the sender returns {status:"skipped"}
   and logs, instead of throwing. That lets us test capture → store → send
   locally, and flip on real delivery later by just setting secrets. */

/* --- phone normalization: Formstack gives free-text; Twilio needs E.164 --- */
export function toE164(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d]/g, "");
  if (digits.length === 10) return `+1${digits}`; // US, no country code
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (String(raw).trim().startsWith("+")) return `+${digits}`;
  return null; // unrecognized — caller records the send as skipped
}

/* --- Twilio SMS --- */
export async function sendSms(env, { to, body }) {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM; // a Twilio number or Messaging Service SID
  if (!sid || !token || !from) {
    console.log(`[sms skipped — Twilio not configured] -> ${to}: ${body.slice(0, 60)}…`);
    return { status: "skipped", error: "twilio-unconfigured" };
  }
  if (!to) return { status: "skipped", error: "no-phone" };

  const params = new URLSearchParams({ To: to, Body: body });
  // A Messaging Service SID (MG…) goes in MessagingServiceSid; a number in From.
  if (from.startsWith("MG")) params.set("MessagingServiceSid", from);
  else params.set("From", from);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${sid}:${token}`),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { status: "failed", error: data.message || `twilio ${res.status}` };
  return { status: "sent", providerId: data.sid };
}

/* --- Resend email ---
   `from` must be on the verified domain (ccea-directory.com) for delivery, but
   that mailbox isn't monitored. `reply_to` points replies at a real inbox so a
   volunteer who hits Reply actually reaches someone — Vickie, the Volunteer
   Coordinator, fields these. Override per-send with `replyTo`, or globally with
   the RESEND_REPLY_TO env var. */
const REPLY_TO_DEFAULT = "Vickie.Wright@cc-ea.org";

export async function sendEmail(env, { to, subject, html, text, replyTo }) {
  const key = env.RESEND_API_KEY;
  const from = env.RESEND_FROM; // "BlessFest <blessfest@yourdomain>"
  if (!key || !from) {
    console.log(`[email skipped — Resend not configured] -> ${to}: ${subject}`);
    return { status: "skipped", error: "resend-unconfigured" };
  }
  if (!to) return { status: "skipped", error: "no-email" };

  const reply_to = replyTo || env.RESEND_REPLY_TO || REPLY_TO_DEFAULT;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, text, reply_to }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { status: "failed", error: data.message || `resend ${res.status}` };
  return { status: "sent", providerId: data.id };
}

/* Bulk email via Resend's batch endpoint (up to 100 messages per request), so a
   team-wide announcement is a handful of API calls instead of one-per-person.
   `messages` is [{ to, subject, html, text, replyTo }]. Returns {sent, failed}. */
export async function sendEmailBatch(env, messages) {
  const key = env.RESEND_API_KEY;
  const from = env.RESEND_FROM;
  if (!key || !from) {
    console.log(`[email batch skipped — Resend not configured] ${messages.length} message(s)`);
    return { sent: 0, failed: 0, skipped: messages.length };
  }
  const replyToDefault = env.RESEND_REPLY_TO || REPLY_TO_DEFAULT;
  let sent = 0, failed = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({
      from, to: m.to, subject: m.subject, html: m.html, text: m.text,
      reply_to: m.replyTo || replyToDefault,
    }));
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify(chunk),
      });
      if (res.ok) {
        sent += chunk.length;
      } else {
        failed += chunk.length;
        const d = await res.json().catch(() => ({}));
        console.log(`[email batch failed] resend ${res.status}: ${d.message || ""}`);
      }
    } catch (e) {
      failed += chunk.length;
      console.log(`[email batch error] ${String(e).slice(0, 160)}`);
    }
  }
  return { sent, failed };
}
