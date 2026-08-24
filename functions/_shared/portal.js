/* The volunteer team portal — shared so the real token page (/team/<token>) and
   the leader/admin preview (/admin/team/preview) render the exact same thing.
   buildAreaBoot() assembles the boot data for one area; portalPage() renders the
   shell + client. Pass {preview:true} to show the "this is what volunteers see"
   banner instead of treating the viewer as a real volunteer. */

import { postsForArea, teamMembers } from "./board.js";
import { leadFor } from "./leads.js";
import { leaderPhotoForEmails } from "./roster.js";

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* One entry per person, carrying every shift they signed up for, so someone on
   both shifts appears once — not once per shift row. Staff (area leads) keep
   their first name + a badge; volunteers get first name + last initial. */
function collapseTeam(members) {
  const byPerson = new Map();
  for (const m of members) {
    const first = (m.first_name || "").trim();
    const last = (m.last_name || "").trim();
    const key = (first + "|" + last).toLowerCase();
    if (!byPerson.has(key)) byPerson.set(key, { first, last, staff: false, role: null, shifts: [] });
    const e = byPerson.get(key);
    // If a person has any staff row, they're a lead (whole-day) — shown once in
    // the leads band, never also as a shift volunteer.
    if (m.staff_role) { e.staff = true; e.role = e.role || m.staff_role; }
    if (m.shift && !e.shifts.includes(m.shift)) e.shifts.push(m.shift);
  }
  return [...byPerson.values()].map((e) => ({
    name: e.staff ? (e.first + (e.last ? " " + e.last : "")) : (e.first + (e.last ? " " + e.last[0] + "." : "")),
    staff: e.staff,
    role: e.role,
    shifts: e.shifts.sort(),
  }));
}

/* Build the same boot object the token portal uses, for a given area. */
export async function buildAreaBoot(env, areaId, firstName) {
  const posts = await postsForArea(env, areaId);
  const lead = leadFor(areaId);
  const leadPhoto = lead ? await leaderPhotoForEmails(env, lead.emails) : null;
  const members = await teamMembers(env, areaId);
  return {
    firstName,
    areaId,
    lead: lead ? { ...lead, photo: leadPhoto } : null,
    // Volunteers: first name + last initial only. Staff Leadership: full name + badge.
    // Collapsed so a both-shift volunteer is one entry carrying both shifts.
    team: collapseTeam(members),
    posts: posts.map((p) => ({
      id: p.id, author: p.author, body: p.body, pinned: !!p.pinned, createdAt: p.created_at,
    })),
  };
}

export function portalPage(boot, fallback, opts = {}) {
  return new Response(portalShell(boot, fallback, opts), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function portalShell(boot, fallback, opts) {
  const banner = opts.preview
    ? `<div class="pvw">👀 Preview — this is exactly what a volunteer on this team sees. ` +
      `<a href="${esc(opts.backHref || "/admin/team")}">← Back</a></div>`
    : "";
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Your BlessFest Team</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800;900&family=UnifrakturCook:wght@700&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--bg2:#f3ede4;--orange:#d97757;--orange-deep:#c15f3f;--orange-soft:#f6e1d7;--line:#e7e0d6;--muted:#6f6960;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55;}
.top{background:var(--ink);color:#fff;padding:8px 16px;text-align:center;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;}
.top .mk{font-family:'UnifrakturCook',serif;font-size:1rem;letter-spacing:0;}
.top .tk-brand{display:inline-flex;align-items:center;}
.top .tk-brand img{height:16px;display:block;filter:brightness(0) invert(1);}
.top a{color:#fff;text-decoration:none;}
.top .site-link{text-decoration:underline;opacity:.85;}.top .site-link:hover{opacity:1;}
.pvw{background:var(--orange);color:#fff;text-align:center;padding:9px 16px;font-size:.82rem;font-weight:700;}
.pvw a{color:#fff;text-decoration:underline;font-weight:800;white-space:nowrap;}
main{max-width:760px;margin:0 auto;padding:24px 20px 80px;}
.hero{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:26px 26px 22px;margin-bottom:20px;}
.eyebrow{font-weight:800;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-deep);}
.hero h1{margin:6px 0 2px;font-weight:900;text-transform:uppercase;letter-spacing:-.02em;font-size:clamp(1.7rem,5vw,2.4rem);}
.hero .sub{color:var(--muted);}
.lead{display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid var(--line);}
.lead .av{width:42px;height:42px;border-radius:50%;background:var(--orange-soft);color:var(--orange-deep);display:grid;place-items:center;font-weight:900;flex:0 0 auto;}
.lead img.av{object-fit:cover;}
.lead b{display:block;}.lead a{color:var(--orange-deep);font-size:.9rem;}
.sec-title{font-weight:900;text-transform:uppercase;letter-spacing:.02em;font-size:1rem;margin:26px 4px 10px;}
.post{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:12px;}
.post.pin{border-color:var(--orange);box-shadow:0 0 0 1px var(--orange);}
.post .meta{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;display:flex;gap:8px;align-items:center;}
.pintag{background:var(--orange);color:#fff;font-weight:800;padding:2px 8px;border-radius:999px;font-size:.62rem;}
.post .body{white-space:pre-wrap;}
.post .body a{color:var(--orange-deep);word-break:break-word;}
.yt-embed{position:relative;width:100%;aspect-ratio:16/9;margin-top:12px;border-radius:10px;overflow:hidden;background:#000;}
.yt-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}
.empty{color:var(--muted);padding:20px;text-align:center;border:1px dashed var(--line);border-radius:12px;}
.card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:28px;margin:40px auto;max-width:560px;}
.card h1{font-weight:900;text-transform:uppercase;letter-spacing:-.01em;}
.detail{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin-top:14px;font-size:.95rem;}
.detail dt{color:var(--muted);}.detail dd{margin:0;font-weight:600;}
.panel{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:16px;}
.panel h3{margin:0 0 8px;font-weight:900;text-transform:uppercase;letter-spacing:.02em;font-size:.95rem;}
.panel p{margin:0 0 12px;color:#33302c;}
.ul{margin:0;padding-left:20px;}.ul li{margin:4px 0;}
.team{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;}
.shift-grp{margin-top:16px;}.shift-grp:first-child{margin-top:6px;}
.shift-hd{font-weight:900;text-transform:uppercase;font-size:.72rem;letter-spacing:.06em;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:8px;}
.shift-n{background:var(--bg2);color:var(--ink);border-radius:999px;padding:1px 9px;font-size:.7rem;font-weight:800;}
.shift-empty{color:var(--muted);font-size:.85rem;}
.chip{background:var(--bg2);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:.85rem;font-weight:600;}
.chip.staff{background:var(--orange-soft);border-color:var(--orange);color:var(--orange-deep);}
.chip .role{font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;margin-left:6px;opacity:.85;}
.shcols{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;}
.shcol{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:12px 14px;min-width:0;}
.shift-win{font-size:.72rem;font-weight:700;color:var(--muted);margin:-4px 0 8px;}
.shift-band{margin-top:16px;}
@media (max-width:560px){.shcols{grid-template-columns:1fr;}}
</style></head><body>
<div class="top"><a class="tk-brand" href="/"><img src="/images/logo-wordmark.png" alt="BlessFest"></a> Your Team Portal <a class="site-link" href="/">Visit the full website ↗</a></div>
${banner}
<main id="app">${fallback || '<div class="empty">Loading your team page…</div>'}</main>
<script>window.BOOT=${JSON.stringify(boot)};</script>
<script src="/data.js"></script>
<script>${CLIENT}</script>
</body></html>`;
}

const CLIENT = `
(() => {
  const B = window.BOOT;
  if (!B || B.invalid || B.pending || !window.BLESSFEST) return;
  const app = document.getElementById("app");
  const esc = (s) => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const area = (window.BLESSFEST.areas || []).find(a => a.id === B.areaId) || { name: B.areaId, summary: "", commitment: [] };

  const initials = (B.lead && B.lead.name || "").split(/[^A-Za-z]/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join("");
  const emails = (B.lead && B.lead.emails) || [];
  const contact = emails.length
    ? emails.map(e => '<a href="mailto:'+esc(e)+'">'+esc(e)+'</a>').join('<br>')
    : '<span style="font-size:.9rem;color:var(--muted)">will be in touch before the event</span>';
  const avatar = (B.lead && B.lead.photo)
    ? '<img class="av" src="'+esc(B.lead.photo)+'" alt="'+esc(B.lead.name)+'">'
    : '<div class="av">'+esc(initials||"★")+'</div>';
  const leadBlock = B.lead ? (
    '<div class="lead">'+avatar+'<div><span class="eyebrow">Your team lead</span>' +
    '<b>'+esc(B.lead.name)+'</b>' + contact +
    '</div></div>') : "";

  const when = (iso) => { try { return new Date(iso).toLocaleDateString(undefined,{month:"short",day:"numeric"}); } catch { return ""; } };
  // Render an announcement: escape the text, linkify URLs, and embed any YouTube
  // link as a player below. We build the embed from the video id ourselves, so
  // no arbitrary HTML is ever injected.
  const ytId = (u) => { const m = u.match(/(?:youtube\\.com\\/(?:watch\\?v=|embed\\/|shorts\\/)|youtu\\.be\\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : null; };
  const richBody = (text) => {
    const s = String(text == null ? "" : text);
    const re = /(https?:\\/\\/[^\\s<]+)/g;
    let html = "", last = 0, m; const embeds = [];
    while ((m = re.exec(s)) !== null) {
      html += esc(s.slice(last, m.index));
      const url = m[0], id = ytId(url);
      if (id && embeds.indexOf(id) < 0) embeds.push(id);
      html += '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + '</a>';
      last = m.index + url.length;
    }
    html += esc(s.slice(last));
    html += embeds.map(id => '<div class="yt-embed"><iframe src="https://www.youtube.com/embed/' + id + '" title="Announcement video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>').join("");
    return html;
  };
  const postCard = (p) =>
    '<div class="post'+(p.pinned?' pin':'')+'"><div class="meta">'+(p.pinned?'<span class="pintag">Pinned</span>':'')+
    esc(p.author)+' · '+when(p.createdAt)+'</div><div class="body">'+richBody(p.body)+'</div></div>';
  const board = B.posts.length ? B.posts.map(postCard).join("")
    : '<div class="empty">No announcements yet. Check back — updates from your team lead show up here.</div>';

  // Reminder of what they signed up for: summary + what they'll be doing.
  const youll = (area.whatYoullDo||[]).map(x => '<li>'+esc(x)+'</li>').join("");
  const about = (area.summary || youll) ?
    '<div class="panel"><h3>What you signed up for</h3>' +
    (area.summary ? '<p>'+esc(area.summary)+'</p>' : '') +
    (youll ? '<h3 style="font-size:.8rem;margin-top:4px">What you\\'ll do</h3><ul class="ul">'+youll+'</ul>' : '') +
    '</div>' : '';

  const team = (B.team||[]);
  const chip = (m) => m.staff
    ? '<span class="chip staff">'+esc(m.name)+'<span class="role">'+esc(m.role||"Team Lead")+'</span></span>'
    : '<span class="chip">'+esc(m.name)+'</span>';
  // Two columns by shift (David Barrs' request, 2026-08): Shift 1 on the left,
  // Shift 2 on the right. Team leads (whole-day) and anyone on BOTH shifts span
  // the full width in their own bands above the columns, so nobody is listed
  // twice; the columns hold only single-shift volunteers.
  const SHIFTW = { "1": "6:45–10 AM", "2": "9:45 AM–1:15 PM", "sorting": "Clothing Sorting · Misc dates", "prep": "Kitchen Prep · week of BF" };
  const on = (m, s) => (m.shifts || []).indexOf(s) >= 0;
  const leads   = team.filter(m => m.staff);
  const both    = team.filter(m => !m.staff && on(m,"1") && on(m,"2"));
  const only1   = team.filter(m => !m.staff && on(m,"1") && !on(m,"2"));
  const only2   = team.filter(m => !m.staff && !on(m,"1") && on(m,"2"));
  // Off-day, area-specific shifts (e.g. Clothing Sorting) get their own band —
  // only appears on the area that actually uses that shift, since no one else
  // has it. Truly-unscheduled volunteers fall to "Not yet scheduled".
  const extraIds = [...new Set(team.filter(m => !m.staff).flatMap(m => m.shifts||[]).filter(s => s !== "1" && s !== "2"))].sort();
  const noShift = team.filter(m => !m.staff && !(m.shifts||[]).length);
  const volCount = team.filter(m => !m.staff).length;
  const band = (label, ms) => !ms.length ? '' :
    '<div class="shift-grp shift-band"><div class="shift-hd">'+esc(label)+' <span class="shift-n">'+ms.length+'</span></div>' +
    '<div class="team">'+ms.map(chip).join("")+'</div></div>';
  const col = (label, win, ms) =>
    '<div class="shcol"><div class="shift-hd">'+esc(label)+' <span class="shift-n">'+ms.length+'</span></div>' +
    '<div class="shift-win">'+esc(win)+'</div>' +
    (ms.length ? '<div class="team">'+ms.map(chip).join("")+'</div>' : '<div class="shift-empty">No one assigned yet.</div>') +
    '</div>';
  const extraBands = extraIds.map(id =>
    band(SHIFTW[id] || id, team.filter(m => !m.staff && on(m, id)))).join("");
  const teamPanel =
    '<div class="panel"><h3>Your team ('+volCount+' volunteers)</h3>' +
    band('Team leads', leads) +
    band('On both shifts', both) +
    '<div class="shcols">' + col('Shift 1', SHIFTW["1"], only1) + col('Shift 2', SHIFTW["2"], only2) + '</div>' +
    extraBands +
    band('Not yet scheduled', noShift) +
    '</div>';

  app.innerHTML =
    '<div class="hero"><span class="eyebrow">You\\'re on the team</span>' +
    '<h1>'+esc(area.name)+'</h1>' +
    '<p class="sub">Hi '+esc(B.firstName)+' — welcome to your team page. Everything you need for BlessFest is here, and your lead will post updates below.</p>' +
    leadBlock + '</div>' +
    about +
    '<div class="sec-title">Announcements</div>' + board +
    teamPanel;
})();
`;
