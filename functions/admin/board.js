/* GET /admin/board — post and pin announcements that show on the team portals.
   Admin-only. Loads /data.js for the area list; posts via /admin/board/post. */

import { identify, AuthUnavailable } from "../_shared/auth.js";
import { postScope, canAssign, isOverseer } from "../_shared/owners.js";
import { loginHtml } from "../_shared/loginpage.js";
import { AVATAR_WIDGET } from "../_shared/avatarwidget.js";

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) {
      return html(`<div class="card"><h1>Sign-in unavailable</h1><p>${esc(err.message)}</p></div>`, 503);
    }
    throw err;
  }
  if (!email) return new Response(loginHtml("Announcements"), { headers: { "content-type": "text/html; charset=utf-8" } });
  const scope = postScope(email);
  if (scope !== "*" && scope.length === 0) return html(`<div class="card"><h1>Not authorized</h1><p>You don't have a board to post to.</p></div>`, 403);
  // Area leaders manage announcements from their unified team home.
  if (!canAssign(email)) return new Response(null, { status: 302, headers: { location: "/admin/team" } });
  return html(null, 200, { assigner: canAssign(email), overseer: isOverseer(email) });
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const html = (inner, status, flags) =>
  new Response(shell(inner, flags || {}), { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

function shell(inner, flags) {
  const nav =
    (flags.overseer ? '<a href="/admin">Edit copy</a> ' : '') +
    (flags.assigner ? '<a href="/admin/roster">Queue</a> ' : '') +
    '<a href="/admin/people">Directory</a> <a href="/admin/board" class="on">Announcements</a>' +
    ' <a href="/admin/stats">Guest RSVPs</a>' +
    ' <a href="/admin/team/preview" target="_blank" rel="noopener">Team preview</a>' +
    ' <a href="/" target="_blank" rel="noopener">View site ↗</a>';
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Announcements — BlessFest 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--bg2:#f3ede4;--orange:#d97757;--orange-deep:#c15f3f;--orange-soft:#f6e1d7;--line:#e7e0d6;--muted:#6f6960;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);}
header{background:var(--paper);border-bottom:1px solid var(--line);padding:16px 24px;position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px 20px;flex-wrap:wrap;}
header h1{margin:0;font-size:1.1rem;font-weight:800;}header .who{color:var(--muted);font-size:.85rem;}
header nav{display:flex;gap:6px;margin-right:auto;}
header nav a{font-size:.85rem;font-weight:700;color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:999px;}
header nav a:hover{color:var(--ink);background:var(--bg2);}header nav a.on{color:var(--orange-deep);background:var(--orange-soft);}
main{max-width:820px;margin:0 auto;padding:24px;}
.composer{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:20px;margin-bottom:24px;}
.composer h2{margin:0 0 14px;font-size:1.05rem;}
label{display:block;font-weight:800;font-size:.8rem;margin:12px 0 5px;}
textarea,select,input{width:100%;font-family:inherit;font-size:.95rem;border:1px solid var(--line);border-radius:9px;padding:10px 12px;background:var(--bg);}
textarea{min-height:90px;resize:vertical;}
.row{display:flex;gap:14px;flex-wrap:wrap;align-items:end;margin-top:12px;}
.row>div{flex:1;min-width:180px;}
.check{display:flex;align-items:center;gap:8px;font-size:.9rem;font-weight:700;}
.check input{width:auto;}
button{font-family:inherit;font-weight:800;border:none;border-radius:9px;padding:11px 20px;cursor:pointer;background:var(--orange);color:#fff;}
button:hover{background:var(--orange-deep);}button.ghost{background:transparent;color:var(--muted);border:1px solid var(--line);padding:6px 12px;font-size:.8rem;}
button:disabled{opacity:.5;}
.post{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:15px 17px;margin-bottom:12px;}
.post.pin{border-color:var(--orange);}
.post .meta{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.pintag{background:var(--orange);color:#fff;font-weight:800;padding:2px 8px;border-radius:999px;font-size:.62rem;}
.scope{background:var(--bg2);padding:2px 8px;border-radius:999px;font-weight:700;}
.post .body{white-space:pre-wrap;font-size:.95rem;}
.post .body a{color:var(--orange-deep);word-break:break-word;}
.post .body .edit-ta{width:100%;min-height:80px;font-family:inherit;font-size:.95rem;border:1px solid var(--line);border-radius:9px;padding:10px 12px;background:var(--bg);resize:vertical;}
.yt-embed{position:relative;width:100%;max-width:520px;aspect-ratio:16/9;margin-top:10px;border-radius:10px;overflow:hidden;background:#000;}
.yt-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}
.actions{margin-top:10px;display:flex;gap:8px;}
.status{font-size:.85rem;margin-left:10px;}.status.ok{color:#2f7d5d;}.status.err{color:var(--orange-deep);}
.card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:24px;max-width:520px;margin:40px auto;}
.empty{color:var(--muted);text-align:center;padding:30px;}
</style></head><body>
<header><h1>BlessFest 2026 — Announcements</h1><nav>${nav}</nav><span class="who" id="who"></span></header>
<main id="app">${inner || '<div class="empty">Loading…</div>'}</main>
<script src="/data.js"></script>
<script>${CLIENT}</script>
<script>${AVATAR_WIDGET}</script>
</body></html>`;
}

const CLIENT = `
(async () => {
  const app = document.getElementById("app");
  if (!window.BLESSFEST) return;
  const esc = (s) => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const areas = window.BLESSFEST.areas.map(a => ({id:a.id,name:a.name}));
  const areaName = (id) => id ? ((areas.find(a=>a.id===id)||{}).name || id) : "All areas";

  let SCOPE = []; // "*" for admins, else [areaIds] they may post to

  async function load() {
    const data = await (await fetch("/admin/board/data")).json();
    if (data.error) { app.innerHTML = '<div class="empty">'+esc(data.error)+'</div>'; return; }
    document.getElementById("who").textContent = data.me;
    SCOPE = data.scope;
    render(data.posts || []);
  }

  const when = (iso) => { try { return new Date(iso).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}); } catch { return ""; } };
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
  const canManage = (areaId) => SCOPE === "*" || (areaId && SCOPE.includes(areaId));

  function render(posts) {
    // Admins can post to all areas or any one; leaders only to their own area(s).
    const myAreas = SCOPE === "*" ? areas : areas.filter(a => SCOPE.includes(a.id));
    const areaOpts = (SCOPE === "*" ? '<option value="">All areas (everyone)</option>' : '') +
      myAreas.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join("");
    const composer =
      '<div class="composer"><h2>Post an announcement</h2>' +
      '<label>Message</label><textarea id="body" placeholder="e.g. Mandatory team meeting Sunday Nov 22 at 6pm in the sanctuary. Please be there!"></textarea>' +
      '<div class="row"><div><label>Show to</label><select id="area">'+areaOpts+'</select></div>' +
      '<div style="flex:0 0 auto"><label class="check"><input type="checkbox" id="pin"> Pin to top</label></div>' +
      '<div style="flex:0 0 auto"><label class="check"><input type="checkbox" id="notify"> Text the team</label></div>' +
      '<div style="flex:0 0 auto"><button id="send">Post</button><span class="status" id="st"></span></div></div>' +
      '<div class="small" style="color:var(--muted);margin-top:8px">Every post emails that area’s team. “Text the team” also SMSes everyone who opted in — use it for things that matter.</div></div>';

    const list = posts.length ? posts.map(p => {
      const actions = canManage(p.area_id)
        ? '<div class="actions"><button class="ghost" data-edit="'+p.id+'">Edit</button>' +
          '<button class="ghost" data-pin="'+p.id+'" data-to="'+(p.pinned?0:1)+'">'+(p.pinned?'Unpin':'Pin')+'</button>' +
          '<button class="ghost" data-del="'+p.id+'">Delete</button></div>'
        : '<div class="small" style="color:var(--muted);margin-top:8px">Posted by the leadership team</div>';
      return '<div class="post'+(p.pinned?' pin':'')+'" data-post="'+p.id+'"><div class="meta">'+(p.pinned?'<span class="pintag">Pinned</span>':'')+
        '<span class="scope">'+esc(areaName(p.area_id))+'</span>'+esc(p.author)+' · '+when(p.created_at)+'</div>' +
        '<div class="body">'+richBody(p.body)+'</div>' + actions + '</div>';
    }).join("") : '<div class="empty">No announcements yet.</div>';

    app.innerHTML = composer + '<h2 style="font-size:1rem">Posted</h2>' + list;

    document.getElementById("send").onclick = async () => {
      const body = document.getElementById("body").value.trim();
      const st = document.getElementById("st");
      if (!body) { st.textContent="Write a message first"; st.className="status err"; return; }
      const notify = document.getElementById("notify").checked;
      const areaId = document.getElementById("area").value||null;
      if (notify && !confirm("This will TEXT everyone in "+(areaId?areaName(areaId):"every area")+" who opted in. Send it?")) return;
      st.textContent="Posting…"; st.className="status";
      const res = await fetch("/admin/board/post", {method:"POST",headers:{"content-type":"application/json"},
        body: JSON.stringify({action:"create", areaId, body, pinned:document.getElementById("pin").checked, notify})});
      const out = await res.json();
      if (out.error) { st.textContent=out.error; st.className="status err"; return; }
      st.textContent = "Posted"+(out.emailed?(" — emailed "+out.emailed):"")+(out.texted?(" · texted "+out.texted):""); st.className="status ok";
      setTimeout(load, 700);
    };

    app.querySelectorAll("[data-pin]").forEach(b => b.onclick = async () => {
      await fetch("/admin/board/post",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"pin",id:Number(b.dataset.pin),pinned:Number(b.dataset.to)===1})});
      load();
    });
    app.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      if (!confirm("Delete this announcement?")) return;
      await fetch("/admin/board/post",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"delete",id:Number(b.dataset.del)})});
      load();
    });
    app.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => {
      const id = Number(b.dataset.edit);
      const post = posts.find(x => x.id === id); if (!post) return;
      const card = b.closest(".post");
      const bodyDiv = card.querySelector(".body");
      bodyDiv.innerHTML = '<textarea class="edit-ta"></textarea><div class="actions">' +
        '<button class="ghost e-save">Save</button><button class="ghost e-cancel">Cancel</button><span class="status e-st"></span></div>';
      const ta = bodyDiv.querySelector(".edit-ta"); ta.value = post.body; ta.focus();
      bodyDiv.querySelector(".e-cancel").onclick = () => load();
      bodyDiv.querySelector(".e-save").onclick = async () => {
        const nb = ta.value.trim();
        const st = bodyDiv.querySelector(".e-st");
        if (!nb) { st.textContent="Message can’t be empty"; st.className="status err"; return; }
        st.textContent="Saving…"; st.className="status";
        const r = await fetch("/admin/board/post",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"update",id,body:nb})});
        const o = await r.json();
        if (o.error) { st.textContent=o.error; st.className="status err"; return; }
        load();
      };
    });
  }

  load();
})();
`;
