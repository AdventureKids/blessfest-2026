/* GET /admin/roster — the admin view of incoming registrations, with an
   area picker to assign each volunteer. Admin-only (the four overseers).
   The page loads /data.js in the browser for the area list and
   /admin/roster/data for the volunteers, so there's no second copy of either. */

import { identify, AuthUnavailable } from "../_shared/auth.js";
import { canAssign, isOverseer } from "../_shared/owners.js";
import { loginHtml } from "../_shared/loginpage.js";
import { AVATAR_WIDGET } from "../_shared/avatarwidget.js";

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) {
      return html(`<div class="card"><h1>Sign-in unavailable</h1><p>${escapeHtml(err.message)}</p></div>`, 503);
    }
    throw err;
  }
  if (!email) return new Response(loginHtml("Roster"), { headers: { "content-type": "text/html; charset=utf-8" } });
  if (!canAssign(email)) {
    return html(`<div class="card"><h1>Not authorized</h1><p><strong>${escapeHtml(email)}</strong> can't view the roster.</p></div>`, 403);
  }
  return html(PAGE, 200, isOverseer(email));
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const html = (body, status, overseer) =>
  new Response(shell(body, overseer), { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

function shell(inner, overseer) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Roster — BlessFest 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--bg2:#f3ede4;--orange:#d97757;--orange-deep:#c15f3f;--line:#e7e0d6;--muted:#6f6960;--good:#2f7d5d;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);}
header{background:var(--paper);border-bottom:1px solid var(--line);padding:16px 24px;position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px 20px;flex-wrap:wrap;}
header h1{margin:0;font-size:1.1rem;font-weight:800;}header .who{color:var(--muted);font-size:.85rem;}
header nav{display:flex;gap:6px;margin-right:auto;}
header nav a{font-size:.85rem;font-weight:700;color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:999px;}
header nav a:hover{color:var(--ink);background:var(--bg2);}
header nav a.on{color:var(--orange-deep);background:var(--orange-soft,#f6e1d7);}
main{max-width:1000px;margin:0 auto;padding:24px;}
.stats{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
.stat{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:12px 18px;}
.stat b{display:block;font-size:1.5rem;color:var(--orange-deep);}.stat span{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
table{width:100%;border-collapse:collapse;background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden;}
th,td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--line);font-size:.9rem;vertical-align:middle;}
th{background:var(--bg2);font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);}
tr:last-child td{border-bottom:none;}
.pill{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:3px 9px;border-radius:999px;}
.pill.wait{background:var(--orange-soft,#f6e1d7);color:var(--orange-deep);}
.pill.done{background:#e3f0e9;color:var(--good);}
.pill.sh{background:#e7edf5;color:#2f5d8f;}
.muted{color:var(--muted);}.small{font-size:.78rem;}
select,button{font-family:inherit;font-size:.85rem;}
select{padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);}
button{font-weight:800;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;background:var(--orange);color:#fff;}
button:hover{background:var(--orange-deep);}button:disabled{opacity:.5;cursor:default;}
.assigned{font-weight:800;}.loading,.empty{padding:40px;text-align:center;color:var(--muted);}
.card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:24px;max-width:520px;margin:40px auto;}
.status{font-size:.8rem;margin-left:8px;}.status.ok{color:var(--good);}.status.err{color:var(--orange-deep);}
</style></head><body>
<header><h1>BlessFest 2026 — Assignment Queue</h1><nav>${overseer ? '<a href="/admin">Edit copy</a> ' : ''}<a href="/admin/roster" class="on">Queue</a> <a href="/admin/people">Directory</a> <a href="/admin/board">Announcements</a> <a href="/admin/stats">Guest RSVPs</a> <a href="/admin/team/preview" target="_blank" rel="noopener">Team preview</a> <a href="/" target="_blank" rel="noopener">View site ↗</a></nav><div class="who" id="who"></div></header>
<main id="app">${inner || '<div class="loading">Loading roster…</div>'}</main>
<script src="/data.js"></script>
<script>${CLIENT}</script>
<script>${AVATAR_WIDGET}</script>
</body></html>`;
}

/* Client runs only on the real page (not the error cards, which have no /data.js need). */
const CLIENT = `
(async () => {
  const app = document.getElementById("app");
  if (!window.BLESSFEST) return; // an error card was served
  const esc = (s) => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const areas = window.BLESSFEST.areas.map(a => ({ id:a.id, name:a.name }));

  let data;
  try { data = await (await fetch("/admin/roster/data")).json(); }
  catch { app.innerHTML = '<div class="loading">Could not load the roster.</div>'; return; }
  if (data.error) { app.innerHTML = '<div class="loading">'+esc(data.error)+'</div>'; return; }
  document.getElementById("who").textContent = "Signed in as " + data.me;

  // The assignment queue is ONLY real volunteers still awaiting an area.
  // Area leaders and already-assigned volunteers live on the Directory page.
  const vols = (data.volunteers || []).filter(v => !v.staff_role);
  const queue = vols.filter(v => !v.area_id);
  const assigned = vols.length - queue.length;
  // A volunteer who signed up for both shifts is TWO rows (one per shift), each
  // assigned separately. Count distinct PEOPLE (by name) for the headcount, and
  // group a person's shifts next to each other in the list.
  const nameKey = (v) => (String(v.first_name||"")+"|"+String(v.last_name||"")).toLowerCase().replace(/\\s+/g," ").trim();
  const distinctPeople = new Set(vols.map(nameKey)).size;
  const SHIFTW = { "1": "6:45–10 AM", "2": "9:45 AM–1:15 PM", "sorting": "Clothing Sorting · Misc dates", "prep": "Kitchen Prep · week of BF" };
  queue.sort((a,b) => nameKey(a).localeCompare(nameKey(b)) || String(a.shift||"9").localeCompare(String(b.shift||"9")));

  const areaOptions = (sel) => '<option value="">Assign area…</option>' +
    areas.map(a => '<option value="'+esc(a.id)+'"'+(a.id===sel?' selected':'')+'>'+esc(a.name)+'</option>').join("");
  const areaName = (id) => (areas.find(a => a.id===id) || {}).name || id;

  // Match a volunteer's free-text choice to an area id, to pre-select the dropdown.
  const norm = (s) => String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
  const ALIAS = { "foodserver": "food-service", "foodservers": "food-service", "kitchen": "food-prep",
    "transportation": "transportation-team", "transportationservices": "transportation-team", "transportationservice": "transportation-team" };
  const matchArea = (choice) => {
    if (!choice) return "";
    const c = norm(choice);
    if (ALIAS[c]) return ALIAS[c];
    const hit = areas.find(a => norm(a.name)===c || a.id===c || norm(a.name).includes(c) || c.includes(norm(a.name)));
    return hit ? hit.id : "";
  };
  const choiceCell = (v) => {
    const line = (label, txt) => txt ? '<div class="small"><b>'+label+'</b> '+esc(txt)+'</div>' : '';
    const extras = Object.entries(v.extras||{}).map(([k,val]) => '<div class="small" style="color:var(--muted);margin-top:2px"><b>'+esc(k)+':</b> '+esc(val)+'</div>').join('');
    return (line('1st', v.choice1) + line('2nd', v.choice2) + extras) || '<span class="muted small">—</span>';
  };

  const row = (v) => {
    const contact = [v.email, v.phone].filter(Boolean).map(esc).join('<br>') || '<span class="muted">—</span>';
    const consent = v.sms_consent ? '' : ' <span class="small muted">(no SMS consent)</span>';
    const preselect = matchArea(v.choice1) || matchArea(v.choice2);
    const shiftOpt = '<select data-shift="'+v.id+'"><option value="">No specific shift</option>' +
      '<option value="1"'+(v.shift==="1"?" selected":"")+'>Shift 1 · 6:45–10 AM</option>' +
      '<option value="2"'+(v.shift==="2"?" selected":"")+'>Shift 2 · 9:45 AM–1:15 PM</option>' +
      '<option value="sorting"'+(v.shift==="sorting"?" selected":"")+'>Clothing Sorting · Misc dates (Clothing)</option>' +
      '<option value="prep"'+(v.shift==="prep"?" selected":"")+'>Kitchen Prep · week of BF (Kitchen)</option></select>';
    const noteRow = '<div style="margin-top:7px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
      '<input type="text" data-note="'+v.id+'" value="'+esc(v.note||'')+'" placeholder="Add a note (shows on the Directory)…" style="flex:1;min-width:200px;padding:6px 9px;font-size:.82rem;border:1px solid var(--line);border-radius:7px;background:var(--bg);color:var(--ink);font-family:inherit">' +
      '<button data-savenote="'+v.id+'" style="background:var(--bg2);color:var(--ink);border:1px solid var(--line);font-size:.8rem;padding:6px 11px">Save note</button>' +
      '<span class="status" data-notestatus="'+v.id+'" style="font-size:.78rem"></span></div>';
    const action = '<select data-vol="'+v.id+'">'+areaOptions(preselect)+'</select> '+shiftOpt+' <button data-assign="'+v.id+'">Assign</button><span class="status" data-status="'+v.id+'"></span>' + noteRow;
    const shiftBadge = v.shift ? ' <span class="pill sh">'+SHIFTW[v.shift]+'</span>' : ' <span class="pill wait">no shift</span>';
    return '<tr><td><b>'+esc(v.first_name)+' '+esc(v.last_name||'')+'</b>'+shiftBadge+consent+'</td><td class="small">'+contact+'</td><td>'+choiceCell(v)+'</td><td>'+action+'</td></tr>';
  };

  const table = queue.length
    ? '<table><thead><tr><th>Name</th><th>Contact</th><th>Choices &amp; responses</th><th>Assign to area</th></tr></thead><tbody>'+queue.map(row).join("")+'</tbody></table>'
    : '<div class="empty">🎉 Nobody is waiting — everyone who has registered is assigned.<br><span class="small">New registrations show up here automatically.</span></div>';

  app.innerHTML =
    '<div class="stats"><div class="stat"><b>'+queue.length+'</b><span>Shifts to assign</span></div>' +
    '<div class="stat"><b>'+assigned+'</b><span>Shifts assigned</span></div>' +
    '<div class="stat"><b>'+distinctPeople+'</b><span>Volunteers (people)</span></div></div>' +
    '<p class="small" style="color:var(--muted);margin:-4px 0 14px">Each shift is assigned separately, so a volunteer who chose both shifts shows once per shift below (tagged with the shift time).</p>' +
    table;

  app.addEventListener("click", async (e) => {
    const noteBtn = e.target.closest("[data-savenote]");
    if (noteBtn) {
      const id = noteBtn.dataset.savenote;
      const inp = app.querySelector('[data-note="'+id+'"]');
      const st = app.querySelector('[data-notestatus="'+id+'"]');
      noteBtn.disabled = true; st.textContent = "Saving…"; st.className="status";
      try {
        const res = await fetch("/admin/people/edit", { method:"POST", headers:{"content-type":"application/json"},
          body: JSON.stringify({ action:"note", volunteerId:Number(id), note: inp.value }) });
        const out = await res.json();
        if (!res.ok || out.error) throw new Error(out.error || "failed");
        st.textContent = "Saved"; st.className="status ok";
      } catch(err){ st.textContent = err.message; st.className="status err"; }
      finally { noteBtn.disabled = false; }
      return;
    }
    const btn = e.target.closest("[data-assign]");
    if (!btn) return;
    const id = btn.dataset.assign;
    const sel = app.querySelector('[data-vol="'+id+'"]');
    const areaId = sel.value;
    const shiftEl = app.querySelector('[data-shift="'+id+'"]');
    const shift = shiftEl ? shiftEl.value : "";
    const st = app.querySelector('[data-status="'+id+'"]');
    if (!areaId) { st.textContent = "Pick an area first"; st.className="status err"; return; }
    btn.disabled = true; st.textContent = "Assigning…"; st.className="status";
    try {
      const res = await fetch("/admin/roster/assign", { method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({ volunteerId:Number(id), areaId, areaName:areaName(areaId), shift }) });
      const out = await res.json();
      if (!res.ok || out.error) throw new Error(out.error || "failed");
      st.textContent = "Assigned — onboarding "+ (Object.values(out.sent||{}).join("/") || "queued");
      st.className = "status ok";
      setTimeout(() => location.reload(), 1200);
    } catch (err) { st.textContent = err.message; st.className="status err"; btn.disabled=false; }
  });
})();
`;

const PAGE = ""; // real page uses the client; empty inner triggers the loading state
