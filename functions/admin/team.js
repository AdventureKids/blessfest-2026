/* GET /admin/team — the area leader's home. One compact page for a single area:
   their team roster (with quick texting) and their announcements (post / pin /
   text the team), inline. Admins & assigners have the full multi-area tools, so
   they're sent to the Directory instead. Data reuses the existing scoped
   endpoints: /admin/people/data, /admin/people/text, /admin/board/data,
   /admin/board/post. */

import { identify, AuthUnavailable } from "../_shared/auth.js";
import { postScope, canAssign, canViewRoster, isGuestLiaison } from "../_shared/owners.js";
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
  if (!email) return new Response(loginHtml("Your Team"), { headers: { "content-type": "text/html; charset=utf-8" } });
  // Admins / assigners get the full cross-area tools — send them to the Directory.
  if (canAssign(email)) return new Response(null, { status: 302, headers: { location: "/admin/people" } });
  // A shelter liaison with no team area belongs on the Guest RSVP page.
  if (isGuestLiaison(email) && !postScope(email).length) return new Response(null, { status: 302, headers: { location: "/admin/stats" } });
  const scope = postScope(email);
  if (!canViewRoster(email) || scope === "*" || !scope.length) {
    return html(`<div class="card"><h1>Not set up yet</h1><p>You don't have a team area assigned. Ask Christian to add you.</p></div>`, 403);
  }
  return html(null, 200);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const html = (inner, status) =>
  new Response(shell(inner), { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

function shell(inner) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Your Team — BlessFest 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--bg2:#f3ede4;--orange:#d97757;--orange-deep:#c15f3f;--orange-soft:#f6e1d7;--line:#e7e0d6;--muted:#6f6960;--good:#2f7d5d;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);}
header{background:var(--paper);border-bottom:1px solid var(--line);padding:16px 20px;position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:8px 16px;flex-wrap:wrap;}
header h1{margin:0;font-size:1.1rem;font-weight:800;}header .who{color:var(--muted);font-size:.82rem;}
header .hnav{display:flex;gap:8px;margin-right:auto;flex-wrap:wrap;}
header a.site{font-size:.8rem;font-weight:700;color:var(--orange-deep);text-decoration:none;padding:5px 11px;border:1px solid var(--line);border-radius:999px;white-space:nowrap;}
header a.site:hover{background:var(--bg2);}
main{max-width:760px;margin:0 auto;padding:18px 18px 80px;}
h2{font-size:1.05rem;margin:22px 0 12px;display:flex;align-items:center;gap:8px;}
.sec{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:18px;}
.muted{color:var(--muted);}.small{font-size:.8rem;}
label{display:block;font-weight:800;font-size:.8rem;margin:10px 0 5px;}
textarea,select,input{width:100%;font-family:inherit;font-size:.92rem;border:1px solid var(--line);border-radius:9px;padding:10px 12px;background:var(--bg);}
textarea{min-height:74px;resize:vertical;}
.btn{font-family:inherit;font-weight:800;font-size:.85rem;border:none;border-radius:9px;padding:9px 15px;cursor:pointer;background:var(--orange);color:#fff;}
.btn:hover{background:var(--orange-deep);}.btn:disabled{opacity:.45;cursor:default;}
.btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line);}.btn.ghost:hover{background:var(--bg2);}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px;}
.check{display:flex;align-items:center;gap:7px;font-size:.85rem;font-weight:700;}.check input{width:auto;}
.member{display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--line);}
.member:last-child{border-bottom:none;}.member input[type=checkbox]{width:16px;height:16px;}
.member .nm{font-weight:700;}.member .ct{color:var(--muted);font-size:.8rem;}
.member .grow{flex:1;min-width:0;}
.pill{font-size:.64rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:999px;background:var(--bg2);color:var(--muted);}
.pill.ok{background:#e3f0e9;color:var(--good);}
.pill.sh{background:#e7edf5;color:#2f5d8f;}
.post{border:1px solid var(--line);border-radius:11px;padding:12px 14px;margin-top:10px;}
.post.pin{border-color:var(--orange);}
.post .meta{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.pintag{background:var(--orange);color:#fff;font-weight:800;padding:2px 7px;border-radius:999px;font-size:.6rem;}
.post .body{white-space:pre-wrap;font-size:.92rem;}
.post .body a{color:var(--orange-deep);word-break:break-word;}
.post .body .edit-ta{width:100%;min-height:76px;font-family:inherit;font-size:.92rem;border:1px solid var(--line);border-radius:9px;padding:9px 11px;background:var(--bg);resize:vertical;}
.yt-embed{position:relative;width:100%;max-width:480px;aspect-ratio:16/9;margin-top:10px;border-radius:10px;overflow:hidden;background:#000;}
.yt-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}
.actions{margin-top:8px;display:flex;gap:8px;}
.rowbtn{font-weight:800;font-size:.72rem;border:1px solid var(--line);background:var(--paper);border-radius:8px;padding:4px 10px;cursor:pointer;color:var(--ink);}
.rowbtn:hover{background:var(--bg2);}
.status{font-size:.83rem;}.status.ok{color:var(--good);}.status.err{color:var(--orange-deep);}
.hide{display:none;}.empty{color:var(--muted);text-align:center;padding:22px;}
.card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:24px;max-width:520px;margin:40px auto;}
</style></head><body>
<header><h1 id="hdr">BlessFest 2026</h1><nav class="hnav"><a class="site" href="/admin/team/preview" target="_blank" rel="noopener">See volunteer view ↗</a><a class="site" href="/#/team" target="_blank" rel="noopener">Event Team ↗</a><a class="site" href="/" target="_blank" rel="noopener">Website ↗</a></nav><div class="who" id="who"></div></header>
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
  const $ = (id) => document.getElementById(id);
  const areas = window.BLESSFEST.areas.map(a => ({id:a.id,name:a.name}));
  const areaName = (id) => id ? ((areas.find(a=>a.id===id)||{}).name || id) : "All areas";
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

  let SCOPE = [], PEOPLE = [], selected = new Set();

  async function loadTeam() {
    const d = await (await fetch("/admin/people/data")).json();
    if (d.error) return;
    PEOPLE = d.people || [];
    selected = new Set([...selected].filter(id => PEOPLE.some(p=>p.id===id)));
    renderTeam();
  }
  async function loadPosts() {
    const d = await (await fetch("/admin/board/data")).json();
    if (d.error) return;
    renderPosts(d.posts || []);
  }

  // Initial boot: pull scope + who from board/data, team from people/data.
  const board = await (await fetch("/admin/board/data")).json();
  if (board.error) { app.innerHTML = '<div class="empty">'+esc(board.error)+'</div>'; return; }
  SCOPE = board.scope === "*" ? areas.map(a=>a.id) : (board.scope || []);
  $("who").textContent = board.me;
  const myAreaNames = SCOPE.map(areaName).join(" · ");
  $("hdr").textContent = myAreaNames || "Your Team";

  const areaSelect = SCOPE.length > 1
    ? '<label>Post to</label><select id="p-area">'+SCOPE.map(id=>'<option value="'+esc(id)+'">'+esc(areaName(id))+'</option>').join("")+'</select>'
    : '';

  app.innerHTML =
    '<h2>Your team</h2>' +
    '<div class="sec" id="teamsec"><div class="empty">Loading…</div></div>' +
    '<div id="composer" class="sec hide"><b>Text <span id="c-count"></span></b>' +
      '<textarea id="c-body" placeholder="Type your message… only teammates who opted in and have a phone get it."></textarea>' +
      '<div class="row"><button class="btn" id="c-send">Send text</button><button class="btn ghost" id="c-cancel">Cancel</button><span class="status" id="c-status"></span></div></div>' +
    '<h2>Announcements</h2>' +
    '<div class="sec">' +
      '<label>Message</label><textarea id="body" placeholder="e.g. Team meeting Sunday Nov 22, 6pm in the sanctuary — please be there!"></textarea>' +
      areaSelect +
      '<div class="row"><label class="check"><input type="checkbox" id="pin"> Pin to top</label>' +
      '<label class="check"><input type="checkbox" id="notify"> Text the team</label>' +
      '<button class="btn" id="post">Post</button><span class="status" id="p-status"></span></div>' +
      '<div class="small muted" style="margin-top:6px">Every post emails your team. Tick "Text the team" to also SMS everyone who opted in.</div>' +
    '</div>' +
    '<div id="posts"></div>';

  // ---------- Team roster ----------
  function renderTeam() {
    const sec = $("teamsec");
    if (!PEOPLE.length) { sec.innerHTML = '<div class="empty">No one is assigned to your team yet. Christian & Vickie place volunteers — they\\'ll appear here.</div>'; return; }
    const SHIFTW = { "1": "6:45–10 AM", "2": "9:45 AM–1:15 PM", "sorting": "Clothing Sorting · Misc dates", "prep": "Kitchen Prep · week of BF" };
    const shiftsOf = (p) => [...new Set((p.shifts||[]).map(s => s.shift).filter(Boolean))].sort();
    const sorted = [...PEOPLE].sort((a,b) => ((shiftsOf(a)[0]||"9").localeCompare(shiftsOf(b)[0]||"9")) || (a.firstName||"").localeCompare(b.firstName||""));
    const rows = sorted.map(p => {
      const nm = esc((p.firstName||"")+" "+(p.lastName||""));
      const ct = [p.email,p.phone].filter(Boolean).map(esc).join(" · ");
      const consent = p.smsConsent ? '<span class="pill ok">texts on</span>' : '<span class="pill">no sms</span>';
      const sh = shiftsOf(p).map(s => '<span class="pill sh">'+SHIFTW[s]+'</span>').join(" ");
      const checked = selected.has(p.id) ? ' checked' : '';
      return '<div class="member"><input type="checkbox" data-id="'+p.id+'"'+checked+'>' +
        '<div class="grow"><div class="nm">'+nm+' '+sh+'</div><div class="ct">'+(ct||'—')+'</div></div>'+consent+'</div>';
    }).join("");
    sec.innerHTML =
      '<div class="row" style="margin:0 0 6px"><span class="small muted" id="tcount"></span>' +
        '<button class="rowbtn" id="selall">Select all</button><button class="rowbtn" id="clearsel">Clear</button>' +
        '<button class="btn" id="textbtn" disabled style="margin-left:auto">Text selected (0)</button></div>' +
      rows;
    $("tcount").textContent = PEOPLE.length + " on your team";
    sec.querySelectorAll("input[type=checkbox]").forEach(cb => cb.onchange = () => {
      const id = Number(cb.dataset.id);
      if (cb.checked) selected.add(id); else selected.delete(id);
      updTextBtn();
    });
    $("selall").onclick = () => { PEOPLE.forEach(p=>selected.add(p.id)); renderTeam(); };
    $("clearsel").onclick = () => { selected.clear(); renderTeam(); };
    $("textbtn").onclick = openComposer;
    updTextBtn();
  }
  function updTextBtn() {
    const b = $("textbtn"); if (!b) return;
    b.textContent = "Text selected ("+selected.size+")"; b.disabled = selected.size === 0;
  }

  // ---------- Texting the roster ----------
  function openComposer() {
    $("c-count").textContent = selected.size + " selected";
    $("composer").classList.remove("hide");
    $("c-status").textContent=""; $("c-status").className="status"; $("c-body").focus();
  }
  $("c-cancel").onclick = () => $("composer").classList.add("hide");
  $("c-send").onclick = async () => {
    const body = $("c-body").value.trim();
    if (!body) { $("c-status").textContent="Write a message first"; $("c-status").className="status err"; return; }
    if (!confirm("Text "+selected.size+" selected teammate(s) who opted in?")) return;
    $("c-send").disabled=true; $("c-status").textContent="Sending…"; $("c-status").className="status";
    try {
      const o = await (await fetch("/admin/people/text",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({volunteerIds:[...selected],body})})).json();
      if (o.error) throw new Error(o.error);
      const skipped=(o.noConsent||0)+(o.noPhone||0)+(o.offTeam||0);
      $("c-status").textContent="Texted "+o.sent+(skipped?(" · skipped "+skipped):""); $("c-status").className="status ok";
      $("c-body").value="";
    } catch(e){ $("c-status").textContent=e.message; $("c-status").className="status err"; }
    finally { $("c-send").disabled=false; }
  };

  // ---------- Announcements ----------
  function renderPosts(posts) {
    $("posts").innerHTML = posts.length ? posts.map(p => {
      const mine = SCOPE.includes(p.area_id); // leaders manage only their own posts
      const acts = mine
        ? '<div class="actions"><button class="rowbtn" data-edit="'+p.id+'">Edit</button><button class="rowbtn" data-pin="'+p.id+'" data-to="'+(p.pinned?0:1)+'">'+(p.pinned?'Unpin':'Pin')+'</button><button class="rowbtn" data-del="'+p.id+'">Delete</button></div>'
        : '<div class="small muted" style="margin-top:6px">Posted by the leadership team</div>';
      return '<div class="post'+(p.pinned?' pin':'')+'"><div class="meta">'+(p.pinned?'<span class="pintag">Pinned</span>':'')+
        '<span>'+esc(areaName(p.area_id))+'</span>'+esc(p.author)+' · '+when(p.created_at)+'</div>'+
        '<div class="body">'+richBody(p.body)+'</div>'+acts+'</div>';
    }).join("") : '<div class="empty">No announcements yet.</div>';
    $("posts").querySelectorAll("[data-pin]").forEach(b => b.onclick = async () => {
      await fetch("/admin/board/post",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"pin",id:Number(b.dataset.pin),pinned:Number(b.dataset.to)===1})});
      loadPosts();
    });
    $("posts").querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      if (!confirm("Delete this announcement?")) return;
      await fetch("/admin/board/post",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"delete",id:Number(b.dataset.del)})});
      loadPosts();
    });
    $("posts").querySelectorAll("[data-edit]").forEach(b => b.onclick = () => {
      const id = Number(b.dataset.edit);
      const post = posts.find(x => x.id === id); if (!post) return;
      const bodyDiv = b.closest(".post").querySelector(".body");
      bodyDiv.innerHTML = '<textarea class="edit-ta"></textarea><div class="actions"><button class="rowbtn e-save">Save</button><button class="rowbtn e-cancel">Cancel</button><span class="status e-st"></span></div>';
      const ta = bodyDiv.querySelector(".edit-ta"); ta.value = post.body; ta.focus();
      bodyDiv.querySelector(".e-cancel").onclick = () => loadPosts();
      bodyDiv.querySelector(".e-save").onclick = async () => {
        const nb = ta.value.trim(); const st = bodyDiv.querySelector(".e-st");
        if (!nb) { st.textContent="Can’t be empty"; st.className="status err"; return; }
        st.textContent="Saving…"; st.className="status";
        const o = await (await fetch("/admin/board/post",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"update",id,body:nb})})).json();
        if (o.error) { st.textContent=o.error; st.className="status err"; return; }
        loadPosts();
      };
    });
  }
  $("post").onclick = async () => {
    const body = $("body").value.trim();
    if (!body) { $("p-status").textContent="Write a message first"; $("p-status").className="status err"; return; }
    const areaId = SCOPE.length > 1 ? $("p-area").value : SCOPE[0];
    const notify = $("notify").checked;
    if (notify && !confirm("This will TEXT everyone on the "+areaName(areaId)+" team who opted in. Send it?")) return;
    $("post").disabled=true; $("p-status").textContent="Posting…"; $("p-status").className="status";
    try {
      const o = await (await fetch("/admin/board/post",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create",areaId,body,pinned:$("pin").checked,notify})})).json();
      if (o.error) throw new Error(o.error);
      $("p-status").textContent = "Posted"+(o.emailed?(" — emailed "+o.emailed):"")+(o.texted?(" · texted "+o.texted):""); $("p-status").className="status ok";
      $("body").value=""; $("pin").checked=false; $("notify").checked=false;
      loadPosts();
    } catch(e){ $("p-status").textContent=e.message; $("p-status").className="status err"; }
    finally { $("post").disabled=false; }
  };

  loadTeam();
  renderPosts(board.posts || []);
})();
`;
