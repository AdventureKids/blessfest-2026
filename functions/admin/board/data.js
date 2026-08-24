/* GET /admin/board/data — announcements + this user's posting scope.
   Admins see/manage everything; an area leader sees their area's posts plus
   global ones (read-only), and may only post to their own area(s). */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { postScope } from "../../_shared/owners.js";
import { allPosts, postsForArea } from "../../_shared/board.js";

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  const scope = email ? postScope(email) : [];
  if (!email || (scope !== "*" && scope.length === 0)) return json({ error: "not authorized" }, 403);

  let posts;
  if (scope === "*") {
    posts = await allPosts(env);
  } else {
    // An area leader sees their area(s) plus global posts; dedupe across areas.
    const seen = new Map();
    for (const areaId of scope) {
      for (const p of await postsForArea(env, areaId)) seen.set(p.id, p);
    }
    posts = [...seen.values()].sort((a, b) => b.pinned - a.pinned || (a.created_at < b.created_at ? 1 : -1));
  }

  return json({ me: email, scope, posts });
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
