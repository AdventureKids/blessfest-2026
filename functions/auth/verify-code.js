/* POST /auth/verify-code  {email, code}
   On a correct, unexpired code, set the session cookie. */

import { isKnownUser } from "../_shared/owners.js";
import { checkCode, signSession, sessionCookie } from "../_shared/session.js";

export async function onRequestPost({ request, env }) {
  if (!env.SESSION_SECRET) return json({ error: "sign-in not configured" }, 503);

  let email, code;
  try {
    const b = await request.json();
    email = String(b.email || "").trim().toLowerCase();
    code = String(b.code || "").trim();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  if (!email || !code) return json({ error: "enter the code" }, 400);
  if (!isKnownUser(email)) return json({ error: "that code didn't work" }, 401);

  const ok = await checkCode(env, email, code);
  if (!ok) return json({ error: "that code didn't work — check it or request a new one" }, 401);

  // Stamp the sign-in so the Directory can show who has (and hasn't) logged in.
  // Best-effort: a DB hiccup here must never block a valid login.
  try {
    await env.ROSTER.prepare("UPDATE volunteers SET last_login_at = ? WHERE lower(email) = ?")
      .bind(new Date().toISOString(), email).run();
  } catch { /* non-fatal */ }

  const token = await signSession(env.SESSION_SECRET, email);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", "set-cookie": sessionCookie(token) },
  });
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
