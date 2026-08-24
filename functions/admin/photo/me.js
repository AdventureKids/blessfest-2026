/* GET /admin/photo/me — the signed-in user's own name + photo, for the header
   avatar widget. Any recognized backend account may read their own. */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { isKnownUser } from "../../_shared/owners.js";

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  if (!email || !isKnownUser(email)) return json({ error: "not authorized" }, 403);

  const row = await env.ROSTER.prepare(
    "SELECT first_name, last_name, photo FROM volunteers WHERE lower(email) = ? LIMIT 1",
  ).bind(email.toLowerCase()).first();
  const name = row ? [row.first_name, row.last_name].filter(Boolean).join(" ").trim() : "";

  return json({ email, name: name || email, photo: (row && row.photo) || null });
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
