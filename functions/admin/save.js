/* POST /admin/save — write one area's copy.

   Ownership and the editable-field whitelist are enforced here, not in
   the browser. A leader hand-crafting a request still cannot touch an
   area that isn't theirs, or any field outside EDITABLE_FIELDS. */

import { identify, AuthUnavailable } from "../_shared/auth.js";
import { canEdit, TEXT_FIELDS, LIST_FIELDS } from "../_shared/owners.js";
import { saveOverride, clearOverride } from "../_shared/store.js";

const MAX_TEXT = 2000; // characters, per text field
const MAX_ITEMS = 20; // bullets, per list field

const bad = (status, error) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });

export async function onRequestPost({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    /* Can't verify => nobody saves. Fail closed. */
    if (err instanceof AuthUnavailable) {
      return bad(503, "Sign-in is temporarily unavailable — your change was not saved.");
    }
    throw err;
  }
  if (!email) return bad(401, "You're not signed in. Reload the page and sign in again.");

  let body;
  try {
    body = await request.json();
  } catch {
    return bad(400, "Malformed request.");
  }

  const areaId = String(body.area || "");
  if (!areaId) return bad(400, "No area given.");
  if (!canEdit(email, areaId)) return bad(403, "That area isn't assigned to you.");

  if (body.reset) {
    await clearOverride(env, areaId, email);
    return new Response(JSON.stringify({ ok: true, reset: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  const incoming = body.fields;
  if (!incoming || typeof incoming !== "object") return bad(400, "No fields given.");

  const fields = {};
  for (const f of TEXT_FIELDS) {
    if (incoming[f] === undefined) continue;
    const v = String(incoming[f]).trim();
    if (v.length > MAX_TEXT) return bad(400, `"${f}" is too long (max ${MAX_TEXT} characters).`);
    fields[f] = v;
  }
  for (const f of LIST_FIELDS) {
    if (incoming[f] === undefined) continue;
    if (!Array.isArray(incoming[f])) return bad(400, `"${f}" must be a list.`);
    const items = incoming[f].map((s) => String(s).trim()).filter(Boolean);
    if (items.length > MAX_ITEMS) return bad(400, `"${f}" has too many lines (max ${MAX_ITEMS}).`);
    if (items.some((s) => s.length > MAX_TEXT)) return bad(400, `A line in "${f}" is too long.`);
    fields[f] = items;
  }

  if (!Object.keys(fields).length) return bad(400, "Nothing to save.");

  /* Tagline and summary carry the page; an empty one would render a blank
     area. Bullets may legitimately be empty (e.g. no requirements). */
  for (const f of TEXT_FIELDS) {
    if (fields[f] !== undefined && !fields[f]) return bad(400, `"${f}" can't be empty.`);
  }

  await saveOverride(env, areaId, fields, email);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
