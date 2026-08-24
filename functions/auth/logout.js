/* POST /auth/logout — clear the session cookie. */
import { clearCookie } from "../_shared/session.js";

export function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", "set-cookie": clearCookie() },
  });
}
