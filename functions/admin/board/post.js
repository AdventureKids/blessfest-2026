/* POST /admin/board/post — create, pin/unpin, or delete an announcement, with
   optional SMS broadcast to the area's team.
     {action:"create", areaId?, body, pinned?, notify?}
     {action:"pin", id, pinned}
     {action:"delete", id}
   Admins may act on any area (incl. all-areas). Area leaders may only act on
   their own area(s). */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { canPostToArea } from "../../_shared/owners.js";
import { createPost, setPinned, deletePost, updatePost, getPost, textableVolunteers, emailableVolunteers } from "../../_shared/board.js";
import { recordMessage } from "../../_shared/roster.js";
import { sendSms, sendEmailBatch } from "../../_shared/notify.js";
import { smsFor, announcement } from "../../_shared/messages.js";
import { areaName as areaNameFor } from "../../_shared/areas.js";

const SITE = "https://blessfest-2026.pages.dev";

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  if (!email) return json({ error: "sign in" }, 401);

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const now = new Date().toISOString();

  if (b.action === "create") {
    const areaId = b.areaId ? String(b.areaId) : null; // null = all areas
    if (!canPostToArea(email, areaId)) {
      return json({ error: areaId ? "you can't post to that area" : "only admins can post to all areas" }, 403);
    }
    const body = String(b.body || "").trim();
    if (!body) return json({ error: "message is empty" }, 400);

    const author = authorName(email, b.author);
    const post = await createPost(env, { areaId, author, body, pinned: Boolean(b.pinned), now });

    // Email the team EVERY time (deduped by email; author excluded). Runs in the
    // background so posting stays instant even for a big team / all-areas blast.
    const targets = dedupeByEmail(await emailableVolunteers(env, areaId, email));
    if (targets.length) {
      const job = emailBroadcast(env, { areaId, author, body, targets });
      if (waitUntil) waitUntil(job); else await job;
    }

    // SMS only when they ticked "Text the team".
    let texted = 0;
    if (b.notify) texted = await broadcast(env, { areaId, body, now });

    return json({ ok: true, post, texted, emailed: targets.length });
  }

  if (b.action === "pin" || b.action === "delete" || b.action === "update") {
    const post = await getPost(env, Number(b.id));
    if (!post) return json({ error: "not found" }, 404);
    if (!canPostToArea(email, post.area_id)) return json({ error: "not your area" }, 403);
    if (b.action === "pin") {
      await setPinned(env, post.id, Boolean(b.pinned));
    } else if (b.action === "update") {
      const body = String(b.body || "").trim();
      if (!body) return json({ error: "message is empty" }, 400);
      await updatePost(env, post.id, { body });
      return json({ ok: true, post: { ...post, body } });
    } else {
      await deletePost(env, post.id);
    }
    return json({ ok: true });
  }

  return json({ error: "unknown action" }, 400);
}

/* Text the area's consented, assigned volunteers. Each gets their own portal
   link. Logged per post so a double-click can't double-send. */
async function broadcast(env, { areaId, body, now }) {
  const vols = await textableVolunteers(env, areaId);
  let sent = 0;
  for (const v of vols) {
    const url = `${SITE}/team/${v.token}`;
    const msg = smsFor(
      { firstName: v.first_name, lastName: v.last_name },
      `BlessFest update: ${body}\n\nYour team page: ${url}\nReply STOP to opt out.`,
    );
    const r = await safe(() => sendSms(env, { to: v.phone, body: msg }));
    const ok = await recordMessage(env, {
      volunteerId: v.id, wave: `post:${now}`, channel: "sms", toAddr: v.phone,
      status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
    });
    if (ok && r.status === "sent") sent++;
  }
  return sent;
}

/* One row per person for the email blast: a two-shift volunteer has two rows
   (and two tokens) under the same email — collapse to one so they get one email. */
function dedupeByEmail(vols) {
  const seen = new Set();
  const out = [];
  for (const v of vols) {
    const key = String(v.email).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/* Build one personalized announcement email per recipient and send via Resend's
   batch endpoint. Each carries the recipient's own portal link. */
async function emailBroadcast(env, { areaId, author, body, targets }) {
  const areaLabel = areaId ? areaNameFor(areaId) : null;
  const messages = targets.map((v) => {
    const e = announcement.email({
      firstName: v.first_name,
      areaName: areaLabel,
      author,
      body,
      portalUrl: `${SITE}/team/${v.token}`,
    });
    return { to: v.email, subject: e.subject, html: e.html, text: e.text };
  });
  return sendEmailBatch(env, messages);
}

const authorName = (email, given) => (given ? String(given) : "BlessFest Team");
const safe = async (fn) => {
  try { return await fn(); } catch (e) { return { status: "failed", error: String(e).slice(0, 200) }; }
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
