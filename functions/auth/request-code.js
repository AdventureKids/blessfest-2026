/* POST /auth/request-code  {email}
   If the email is a recognized account, email a 6-digit login code. Always
   returns ok (don't reveal who's an admin), but only sends to known users. */

import { isKnownUser } from "../_shared/owners.js";
import { makeCode, storeCode } from "../_shared/session.js";
import { sendEmail } from "../_shared/notify.js";

export async function onRequestPost({ request, env }) {
  let email;
  try {
    email = String((await request.json()).email || "").trim().toLowerCase();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  if (!email) return json({ error: "enter your email" }, 400);

  if (isKnownUser(email)) {
    const code = makeCode();
    await storeCode(env, email, code);
    const r = await sendEmail(env, {
      to: email,
      subject: `Your BlessFest admin code: ${code}`,
      text: `Your BlessFest sign-in code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
      html:
        `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">` +
        `<p>Your BlessFest sign-in code:</p>` +
        `<p style="font-size:30px;font-weight:800;letter-spacing:4px;color:#c15f3f">${code}</p>` +
        `<p style="color:#6f6960">Expires in 10 minutes. If you didn't request this, ignore this email.</p></div>`,
    });
    if (r.status === "failed") return json({ error: "couldn't send the code — try again" }, 502);
  }
  // Same response whether or not the email is known.
  return json({ ok: true });
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
