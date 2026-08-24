/* GET /admin/roster/data — JSON list of volunteers for the admin roster UI.
   Admin-only (the four overseers), same auth as the copy editor. */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { canAssign } from "../../_shared/owners.js";
import { listVolunteers } from "../../_shared/roster.js";
import { extrasFromRaw } from "../../_shared/intake.js";

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  if (!email || !canAssign(email)) return json({ error: "not authorized" }, 403);

  // Attach each submission's extra form answers (comments, professional
  // qualifiers, etc.) so the assigner sees them right on the Queue.
  const volunteers = (await listVolunteers(env)).map((v) => ({ ...v, extras: extrasFromRaw(v.raw_json) }));
  return json({ me: email, volunteers });
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
