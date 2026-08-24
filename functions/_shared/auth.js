/* Identify the signed-in user from their session cookie (email-code login —
   see session.js). No external identity provider or custom domain required. */

import { verifySession, readCookie, COOKIE } from "./session.js";

/* Thrown when we can't decide either way (misconfig) — callers must fail closed
   but report distinctly so a broken deploy is obvious, not a silent crash. */
export class AuthUnavailable extends Error {}

/* Returns the verified email (lowercase), or null if not signed in. */
export async function identify(request, env) {
  /* Local development only: .dev.vars sets DEV_EMAIL, which is gitignored and
     never uploaded. Cannot fire in production unless set by hand in the
     dashboard — don't. */
  if (env.DEV_EMAIL) return String(env.DEV_EMAIL).toLowerCase();

  if (!env.SESSION_SECRET) {
    throw new AuthUnavailable("SESSION_SECRET is not set on the Pages project.");
  }
  const token = readCookie(request, COOKIE);
  if (!token) return null;
  const email = await verifySession(env.SESSION_SECRET, token);
  if (email) await touchSeen(env, email);
  return email;
}

/* Stamp "last seen in the backend" so the Directory reflects real activity, not
   just fresh sign-ins. Throttled to ~30 min via a conditional UPDATE (no extra
   read), and best-effort — a DB hiccup must never break auth. */
async function touchSeen(env, email) {
  if (!env.ROSTER) return;
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    await env.ROSTER.prepare(
      "UPDATE volunteers SET last_login_at = ? WHERE lower(email) = ? AND (last_login_at IS NULL OR last_login_at < ?)",
    ).bind(now.toISOString(), email.toLowerCase(), cutoff).run();
  } catch { /* non-fatal */ }
}
