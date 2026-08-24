/* Public, unauthenticated. The live site merges this over data.js.
   Returns {} when no leader has edited anything yet. */

import { allOverrides } from "../_shared/store.js";

export async function onRequestGet({ env }) {
  let overrides = {};
  try {
    overrides = await allOverrides(env);
  } catch {
    /* KV unreachable — an empty object means the site renders data.js as-is. */
  }
  return new Response(JSON.stringify(overrides), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      /* Edge-cache briefly so this never costs the visitor a round trip,
         but a leader's save still shows up within the minute. */
      "cache-control": "public, max-age=0, s-maxage=30",
    },
  });
}
