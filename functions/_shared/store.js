/* ============================================================
   KV storage for leaders' copy edits.

   data.js stays the baseline. KV holds ONLY the fields a leader has
   changed, one key per area. Empty KV == today's site, exactly.
   ============================================================ */

const areaKey = (id) => `area:${id}`;
const journalKey = (id) => `journal:${id}`;
const HISTORY_LIMIT = 20;

/* { "hair": { tagline, summary, ... }, ... } for every edited area. */
export async function allOverrides(env) {
  const { keys } = await env.CONTENT.list({ prefix: "area:" });
  const entries = await Promise.all(
    keys.map(async (k) => {
      const id = k.name.slice("area:".length);
      return [id, await env.CONTENT.get(k.name, "json")];
    }),
  );
  return Object.fromEntries(entries.filter(([, v]) => v));
}

export const getOverride = (env, id) => env.CONTENT.get(areaKey(id), "json");

export async function saveOverride(env, id, fields, email) {
  const previous = await getOverride(env, id);
  await env.CONTENT.put(areaKey(id), JSON.stringify(fields));
  await appendHistory(env, id, { at: new Date().toISOString(), by: email, previous });
}

export async function clearOverride(env, id, email) {
  const previous = await getOverride(env, id);
  await env.CONTENT.delete(areaKey(id));
  await appendHistory(env, id, { at: new Date().toISOString(), by: email, previous, reset: true });
}

export const getHistory = (env, id) => env.CONTENT.get(journalKey(id), "json").then((h) => h || []);

async function appendHistory(env, id, entry) {
  const history = await getHistory(env, id);
  history.unshift(entry);
  await env.CONTENT.put(journalKey(id), JSON.stringify(history.slice(0, HISTORY_LIMIT)));
}
