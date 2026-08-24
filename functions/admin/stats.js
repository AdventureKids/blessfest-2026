/* GET/POST /admin/stats — set the Guest RSVP number shown on the homepage.
   Volunteers are counted automatically from the roster; guests sign up at the
   shelters (outside this system), so their number is entered here by hand.
   Editable by admins/coordinator and the shelter liaison(s). Stored in KV under
   "guest_count". */

import { identify, AuthUnavailable } from "../_shared/auth.js";
import { canEditGuestCount, canAssign, isOverseer, isGuestLiaison } from "../_shared/owners.js";
import { loginHtml } from "../_shared/loginpage.js";

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return html(`<div class="card"><h1>Sign-in unavailable</h1></div>`, 503);
    throw err;
  }
  if (!email) return new Response(loginHtml("Guest RSVPs"), { headers: { "content-type": "text/html; charset=utf-8" } });
  if (!canEditGuestCount(email)) return html(`<main><div class="card"><h1>Not authorized</h1><p><strong>${esc(email)}</strong> can't edit the Guest RSVP count.</p></div></main>`, 403);

  const guests = Number((await env.CONTENT.get("guest_count")) || 0) || 0;
  const vol = await volunteerCount(env);
  const name = await displayName(env, email);
  return html(page(guests, vol, { email, name, admin: canAssign(email), liaison: isGuestLiaison(email), overseer: isOverseer(email) }), 200);
}

export async function onRequestPost({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  if (!email || !canEditGuestCount(email)) return json({ error: "not authorized" }, 403);

  let n;
  try {
    n = Math.max(0, Math.floor(Number((await request.json()).guests)));
  } catch {
    return json({ error: "bad request" }, 400);
  }
  if (!Number.isFinite(n)) return json({ error: "enter a whole number" }, 400);
  await env.CONTENT.put("guest_count", String(n));
  return json({ ok: true, guests: n });
}

async function volunteerCount(env) {
  try {
    const row = await env.ROSTER.prepare(
      `SELECT COUNT(*) AS n FROM (
         SELECT DISTINCT lower(trim(coalesce(first_name,'') || '|' || coalesce(last_name,''))) FROM volunteers
       )`,
    ).first();
    return Number(row?.n || 0);
  } catch { return 0; }
}

async function displayName(env, email) {
  try {
    const r = await env.ROSTER.prepare(
      "SELECT first_name, last_name FROM volunteers WHERE lower(email) = ? LIMIT 1",
    ).bind(email.toLowerCase()).first();
    const n = r ? [r.first_name, r.last_name].filter(Boolean).join(" ").trim() : "";
    return n || email;
  } catch { return email; }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function nav(u) {
  if (u.admin) {
    return (u.overseer ? '<a href="/admin">Edit copy</a> ' : '') +
      '<a href="/admin/roster">Queue</a> <a href="/admin/people">Directory</a> ' +
      '<a href="/admin/board">Announcements</a> <a href="/admin/stats" class="on">Guest RSVPs</a> ' +
      '<a href="/" target="_blank" rel="noopener">View site ↗</a>';
  }
  return '<a href="/" target="_blank" rel="noopener">View site ↗</a> <a href="/auth/logout">Sign out</a>';
}

function page(guests, vol, u) {
  const pill = u.liaison ? '<span class="pill liaison">Shelter Liaison</span>' : '';
  return `<header><h1>BlessFest 2026 — Guest RSVPs</h1><nav>${nav(u)}</nav>` +
    `<div class="who">${esc(u.name)} ${pill}</div></header>` +
    `<main><div class="card"><h1>Guest RSVPs</h1>` +
    `<p class="muted">This is the number shown on the homepage counter. Guests sign up at the shelters, so update it here as new RSVPs come in — it goes live within a minute.</p>` +
    `<form id="f"><label for="g">Guests signed up so far</label>` +
    `<input id="g" type="number" min="0" step="1" value="${esc(guests)}" inputmode="numeric">` +
    `<button type="submit">Save Guest RSVPs</button><span class="msg" id="msg"></span></form>` +
    `<div class="stat">Volunteers on the roster: <b>${vol}</b> <span class="muted">(counted automatically)</span></div>` +
    `</div></main>`;
}

const html = (inner, status) =>
  new Response(shell(inner), { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

function shell(inner) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Guest RSVPs — BlessFest 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--bg2:#f3ede4;--orange:#d97757;--orange-deep:#c15f3f;--orange-soft:#f6e1d7;--line:#e7e0d6;--muted:#6f6960;--good:#2f7d5d;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);}
header{background:var(--paper);border-bottom:1px solid var(--line);padding:16px 24px;display:flex;justify-content:space-between;align-items:center;gap:12px 20px;flex-wrap:wrap;}
header h1{margin:0;font-size:1.1rem;font-weight:800;}
header nav{display:flex;gap:6px;margin-right:auto;flex-wrap:wrap;}
header nav a{font-size:.85rem;font-weight:700;color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:999px;}
header nav a:hover{color:var(--ink);background:var(--bg2);}
header nav a.on{color:var(--orange-deep);background:var(--orange-soft);}
header .who{color:var(--muted);font-size:.85rem;display:flex;align-items:center;gap:8px;}
.pill{font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:3px 9px;border-radius:999px;}
.pill.liaison{background:#dbeafe;color:#1d4ed8;}
main{max-width:520px;margin:0 auto;padding:40px 20px;}
.card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:28px;}
.card h1{font-size:1.3rem;margin:0 0 8px;}.muted{color:var(--muted);font-size:.9rem;}
.stat{margin-top:20px;padding-top:16px;border-top:1px solid var(--line);font-size:.95rem;}
label{display:block;font-weight:800;font-size:.82rem;margin:18px 0 6px;}
input{width:100%;font-family:inherit;font-size:1.3rem;font-weight:800;border:1px solid var(--line);border-radius:9px;padding:14px 16px;background:var(--bg);}
input:focus{outline:2px solid var(--orange);outline-offset:-1px;background:var(--paper);}
button{margin-top:16px;font-family:inherit;font-weight:800;font-size:.95rem;border:none;border-radius:9px;padding:13px 22px;background:var(--orange);color:#fff;cursor:pointer;}
button:hover{background:var(--orange-deep);}button:disabled{opacity:.5;cursor:default;}
.msg{margin-left:12px;font-size:.9rem;font-weight:600;}.msg.ok{color:var(--good);}.msg.err{color:var(--orange-deep);}
</style></head><body>${inner}
<script>
(() => {
  const f = document.getElementById("f"); if (!f) return;
  const msg = document.getElementById("msg");
  const btn = f.querySelector("button");
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const guests = document.getElementById("g").value;
    btn.disabled = true; msg.textContent = "Saving…"; msg.className = "msg";
    try {
      const r = await fetch("/admin/stats", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ guests }) });
      const o = await r.json();
      if (o.error) throw new Error(o.error);
      msg.textContent = "Saved — " + o.guests + " Guest RSVPs"; msg.className = "msg ok";
    } catch (err) { msg.textContent = err.message; msg.className = "msg err"; }
    finally { btn.disabled = false; }
  });
})();
</script></body></html>`;
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
