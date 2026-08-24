/* GET /admin/team/preview[?area=<id>] — lets a signed-in area leader or admin
   see the volunteer team portal exactly as their team sees it (read-only).
   Leaders may preview only their own area(s); admins & the coordinator any area.
   With no ?area and a single team, it opens that team directly; otherwise it
   shows a small picker. */

import { identify, AuthUnavailable } from "../../_shared/auth.js";
import { rosterScope } from "../../_shared/owners.js";
import { AREA_NAMES, areaName } from "../../_shared/areas.js";
import { buildAreaBoot, portalPage } from "../../_shared/portal.js";
import { loginHtml } from "../../_shared/loginpage.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return errPage("Sign-in unavailable", esc(err.message), 503);
    throw err;
  }
  if (!email) return new Response(loginHtml("Team Preview"), { headers: { "content-type": "text/html; charset=utf-8" } });

  const scope = rosterScope(email); // "*" for admins/coordinator, else [areaIds]
  if (scope !== "*" && (!scope || !scope.length)) {
    return errPage("No team to preview", "You don't have a team area assigned yet. Ask Christian to add you.", 403);
  }
  const areaIds = scope === "*" ? Object.keys(AREA_NAMES) : scope.slice();
  const areaId = (new URL(request.url).searchParams.get("area") || "").trim();

  if (areaId) {
    if (scope !== "*" && !scope.includes(areaId)) return errPage("Not your team", "That team isn't yours to preview.", 403);
    if (!AREA_NAMES[areaId]) return errPage("Unknown area", "That area doesn't exist.", 404);
    const backHref = areaIds.length > 1 ? "/admin/team/preview" : "/admin/team";
    const boot = await buildAreaBoot(env, areaId, "there");
    return portalPage(boot, null, { preview: true, backHref });
  }

  // No area chosen: a single-team leader goes straight in; everyone else picks.
  if (areaIds.length === 1) {
    return new Response(null, { status: 302, headers: { location: "/admin/team/preview?area=" + encodeURIComponent(areaIds[0]) } });
  }
  return pickerPage(areaIds, scope === "*");
}

function pickerPage(areaIds, isAdmin) {
  const cards = areaIds
    .map((id) => ({ id, name: areaName(id) }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => `<a class="tile" href="/admin/team/preview?area=${esc(a.id)}">${esc(a.name)} <span>↗</span></a>`)
    .join("");
  const intro = isAdmin
    ? "Pick a team to see its volunteer portal exactly as that team sees it."
    : "Here are your teams — open one to see the portal your volunteers see.";
  return shell(
    `<h1>See what your team sees</h1><p class="sub">${intro}</p><div class="tiles">${cards}</div>`,
    200,
  );
}

const errPage = (title, msg, status) =>
  shell(`<div class="card"><h1>${esc(title)}</h1><p>${msg}</p></div>`, status);

function shell(inner, status) {
  return new Response(
    `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Team Preview — BlessFest 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--bg2:#f3ede4;--orange:#d97757;--orange-deep:#c15f3f;--orange-soft:#f6e1d7;--line:#e7e0d6;--muted:#6f6960;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);}
main{max-width:720px;margin:0 auto;padding:44px 20px 80px;}
h1{font-size:1.5rem;margin:0 0 6px;}.sub{color:var(--muted);margin:0 0 24px;}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;}
.tile{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--paper);border:1px solid var(--line);
  border-radius:12px;padding:15px 18px;font-weight:800;color:var(--ink);text-decoration:none;font-size:.95rem;}
.tile:hover{border-color:var(--orange);background:var(--orange-soft);color:var(--orange-deep);}
.tile span{color:var(--orange-deep);}
.card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:28px;max-width:520px;margin:20px auto;}
.card a{color:var(--orange-deep);}
a.back{display:inline-block;margin-top:22px;color:var(--muted);font-weight:700;text-decoration:none;font-size:.85rem;}
</style></head><body><main>${inner}<a class="back" href="/admin/team">← Back to dashboard</a></main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}
