/* GET /admin/people — the Directory: everyone in the roster, with search, area
   filter, CSV export, and send-a-text (individual or group). Admin/assigner only.
   Data from /admin/people/data; texting via /admin/people/text. */

import { identify, AuthUnavailable } from "../_shared/auth.js";
import { canViewRoster, canAssign, isOverseer } from "../_shared/owners.js";
import { loginHtml } from "../_shared/loginpage.js";
import { AVATAR_WIDGET } from "../_shared/avatarwidget.js";

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) {
      return html(`<div class="card"><h1>Sign-in unavailable</h1><p>${esc(err.message)}</p></div>`, 503, {});
    }
    throw err;
  }
  if (!email) return new Response(loginHtml("Directory"), { headers: { "content-type": "text/html; charset=utf-8" } });
  if (!canViewRoster(email)) return html(`<div class="card"><h1>Not authorized</h1></div>`, 403, {});
  // Area leaders get the compact single-area home instead of the full Directory.
  if (!canAssign(email)) return new Response(null, { status: 302, headers: { location: "/admin/team" } });
  return html(null, 200, { assigner: canAssign(email), overseer: isOverseer(email) });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const html = (inner, status, flags) =>
  new Response(shell(inner, flags || {}), { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

function shell(inner, flags) {
  const nav =
    (flags.overseer ? '<a href="/admin">Edit copy</a> ' : '') +
    (flags.assigner ? '<a href="/admin/roster">Queue</a> ' : '') +
    '<a href="/admin/people" class="on">Directory</a> <a href="/admin/board">Announcements</a>' +
    ' <a href="/admin/stats">Guest RSVPs</a>' +
    ' <a href="/admin/team/preview" target="_blank" rel="noopener">Team preview</a>' +
    ' <a href="/" target="_blank" rel="noopener">View site ↗</a>';
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Directory — BlessFest 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--bg2:#f3ede4;--orange:#d97757;--orange-deep:#c15f3f;--orange-soft:#f6e1d7;--line:#e7e0d6;--muted:#6f6960;--good:#2f7d5d;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);}
header{background:var(--paper);border-bottom:1px solid var(--line);padding:16px 24px;position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px 20px;flex-wrap:wrap;}
header h1{margin:0;font-size:1.1rem;font-weight:800;}header .who{color:var(--muted);font-size:.85rem;}
header nav{display:flex;gap:6px;margin-right:auto;}
header nav a{font-size:.85rem;font-weight:700;color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:999px;}
header nav a:hover{color:var(--ink);background:var(--bg2);}header nav a.on{color:var(--orange-deep);background:var(--orange-soft);}
main{max-width:1080px;margin:0 auto;padding:20px 24px 80px;}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;}
input,select{font-family:inherit;font-size:.9rem;border:1px solid var(--line);border-radius:9px;padding:9px 12px;background:var(--paper);}
input:focus,select:focus{outline:2px solid var(--orange);}
input[type=search]{min-width:220px;flex:1;}
.btn{font-family:inherit;font-weight:800;font-size:.85rem;border:none;border-radius:9px;padding:9px 15px;cursor:pointer;background:var(--orange);color:#fff;}
.btn:hover{background:var(--orange-deep);}.btn:disabled{opacity:.45;cursor:default;}
.btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line);}.btn.ghost:hover{background:var(--bg2);}
.count{color:var(--muted);font-size:.85rem;margin-left:auto;}
table{width:100%;border-collapse:collapse;background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden;}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);font-size:.88rem;vertical-align:top;}
th{background:var(--bg2);font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);}
tr:last-child td{border-bottom:none;}tr:hover td{background:#fdfbf7;}
.tag{font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:999px;margin-left:6px;}
.tag.lead{background:var(--orange-soft);color:var(--orange-deep);}
.tag.event{background:var(--ink);color:#fff;}
.tag.coord{background:#dde8f3;color:#2f5d8f;}
.tag.liaison{background:#dbeafe;color:#1d4ed8;}
.tag.minor{background:#fde68a;color:#92400e;}
.rec-note{margin-top:4px;font-size:.78rem;line-height:1.4;color:#7a5a1e;background:#fdf6e3;border-left:2px solid #e0c068;padding:3px 8px;border-radius:0 5px 5px 0;}
.login-ok{color:var(--muted);font-weight:400;margin-top:1px;font-size:.72rem;}
.login-no{color:#b8814e;font-weight:600;margin-top:1px;font-size:.72rem;}
.pill{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:999px;}
.pill.done{background:#e3f0e9;color:var(--good);}.pill.wait{background:var(--orange-soft);color:var(--orange-deep);}
.small{font-size:.78rem;}.muted{color:var(--muted);}
.shiftline{margin:2px 0;}.xtra{margin-top:3px;line-height:1.35;}.xk{font-weight:800;color:var(--ink);}
.composer{background:var(--paper);border:1px solid var(--orange);border-radius:12px;padding:16px;margin-bottom:16px;}
.composer textarea{width:100%;min-height:80px;font-family:inherit;font-size:.95rem;border:1px solid var(--line);border-radius:9px;padding:10px 12px;background:var(--bg);resize:vertical;}
.composer .row{display:flex;gap:10px;align-items:center;margin-top:10px;}
.composer.edit{border-color:var(--ink);}
.composer.edit select{font-family:inherit;font-size:.9rem;border:1px solid var(--line);border-radius:9px;padding:9px 12px;background:var(--bg);}
.status{font-size:.85rem;}.status.ok{color:var(--good);}.status.err{color:var(--orange-deep);}
.hide{display:none;}.empty{padding:40px;text-align:center;color:var(--muted);}
.card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:24px;max-width:520px;margin:40px auto;}
td.sel{width:34px;text-align:center;}input[type=checkbox]{width:16px;height:16px;}
.rowbtn{font-family:inherit;font-weight:800;font-size:.72rem;border:1px solid var(--line);background:var(--paper);border-radius:8px;padding:4px 10px;cursor:pointer;color:var(--ink);}
.rowbtn:hover{background:var(--bg2);}
.danger{color:var(--orange-deep);border-color:var(--orange-soft);}.danger:hover{background:var(--orange-soft);}
pre.sample{white-space:pre-wrap;background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:12px;font-size:.8rem;max-height:280px;overflow:auto;font-family:ui-monospace,Menlo,monospace;}
</style></head><body>
<header><h1>BlessFest 2026 — Directory</h1><nav>${nav}</nav><div class="who" id="who"></div></header>
<main id="app">${inner || '<div class="empty">Loading…</div>'}</main>
<script>window.BF_FLAGS=${JSON.stringify({ assigner: !!flags.assigner, overseer: !!flags.overseer })};</script>
<script src="/data.js"></script>
<script>${CLIENT}</script>
<script>${AVATAR_WIDGET}</script>
</body></html>`;
}

const CLIENT = `
(async () => {
  const app = document.getElementById("app");
  if (!window.BLESSFEST) return;
  const FLAGS = window.BF_FLAGS || {};
  const esc = (s) => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const $ = (id) => document.getElementById(id);
  const areas = window.BLESSFEST.areas.map(a => ({id:a.id,name:a.name})).sort((a,b) => a.name.localeCompare(b.name));
  const areaName = (id) => id ? ((areas.find(a=>a.id===id)||{}).name || id) : "";
  // Plain, consistent pill — the area name says enough; no per-area color.
  const areaPill = (id) => '<span class="pill done">'+esc(areaName(id))+'</span>';
  const SHIFTW = { "1": "6:45–10 AM", "2": "9:45 AM–1:15 PM", "sorting": "Clothing Sorting · Misc dates", "prep": "Kitchen Prep · week of BF" };
  const fmtShort = (iso) => { try { return new Date(iso).toLocaleDateString(undefined,{month:"short",day:"numeric"}); } catch { return ""; } };
  const fmtFull = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return ""; } };
  // Login status only applies to backend users (leaders/admins); volunteers use a
  // token link, not the code login, so they never "sign in" here.
  const loginBadge = (p) => !p.role ? '' :
    (p.lastLoginAt
      ? '<div class="small login-ok" title="Last in the backend '+esc(fmtFull(p.lastLoginAt))+'">active '+esc(fmtShort(p.lastLoginAt))+'</div>'
      : '<div class="small login-no">not signed in yet</div>');

  let PEOPLE = [], CAN_EDIT = false, selected = new Set();

  const boot = await (await fetch("/admin/people/data")).json();
  if (boot.error) { app.innerHTML = '<div class="empty">'+esc(boot.error)+'</div>'; return; }
  document.getElementById("who").textContent = boot.me;
  CAN_EDIT = !!boot.canEdit;
  PEOPLE = boot.people || [];

  // Re-fetch people after an edit/delete and redraw the table (chrome stays put).
  async function refresh() {
    const d = await (await fetch("/admin/people/data")).json();
    if (d.error) return;
    PEOPLE = d.people || [];
    selected = new Set([...selected].filter(id => PEOPLE.some(p => p.id === id)));
    render();
  }

  const areaOpts = '<option value="">All areas</option><option value="__none">— Unassigned —</option>' +
    areas.map(a => '<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join("");
  const editAreaOpts = areas.map(a => '<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join("");

  const editorPanel = CAN_EDIT ?
    '<div id="editor" class="composer edit hide"><b>Edit <span id="e-name"></span></b>' +
    '<div class="row"><label style="font-weight:800;font-size:.8rem;display:flex;align-items:center;gap:8px">Reassign to ' +
      '<select id="e-area">'+editAreaOpts+'</select></label>' +
      '<label style="font-weight:800;font-size:.8rem;display:flex;align-items:center;gap:8px">Shift ' +
      '<select id="e-shift"><option value="">Keep as-is</option>' +
      '<option value="1">Shift 1 · 6:45–10 AM</option><option value="2">Shift 2 · 9:45 AM–1:15 PM</option>' +
      '<option value="sorting">Clothing Sorting · Misc dates (Clothing)</option><option value="prep">Kitchen Prep · week of BF (Kitchen)</option></select></label>' +
      '<button class="btn" id="e-save">Save &amp; re-notify</button>' +
      '<button class="rowbtn danger" id="e-del">Delete person</button>' +
      '<button class="btn ghost" id="e-cancel">Cancel</button>' +
      '<span class="status" id="e-status"></span></div>' +
    '<div class="row" style="margin-top:10px;align-items:flex-start"><label style="font-weight:800;font-size:.8rem;flex:1">Coordinator note' +
      '<textarea id="e-note" placeholder="A note about this volunteer — shows on the Directory" style="display:block;width:100%;margin-top:5px;min-height:52px;font-family:inherit;font-size:.9rem;border:1px solid var(--line);border-radius:9px;padding:8px 10px;background:var(--bg);resize:vertical"></textarea></label>' +
      '<button class="btn" id="e-savenote" style="margin-top:26px">Save note</button>' +
      '<span class="status" id="e-notestatus" style="margin-top:30px"></span></div>' +
    '<div class="small muted" style="margin-top:8px">Reassigning sends a fresh onboarding email &amp; text (for those who opted in) for the new team. Deleting removes the person and their team-page link.</div></div>'
    : '';

  const onboardPanel = FLAGS.overseer ?
    '<div id="onboard" class="composer hide"><b>Onboard staff &amp; leaders</b>' +
    '<div id="ob-body" class="small muted" style="margin-top:8px">Loading preview…</div>' +
    '<div class="row"><button class="btn" id="ob-send" disabled>Send to leaders</button>' +
      '<button class="btn ghost" id="ob-cancel">Close</button><span class="status" id="ob-status"></span></div></div>'
    : '';

  app.innerHTML =
    '<div id="composer" class="composer hide"><b>Text <span id="c-count"></span></b>' +
    '<textarea id="c-body" placeholder="Type your message… everyone selected who opted in gets it."></textarea>' +
    '<div class="row"><button class="btn" id="c-send">Send text</button><button class="btn ghost" id="c-cancel">Cancel</button>' +
    '<span class="status" id="c-status"></span></div>' +
    '<div class="small muted" style="margin-top:8px">Only people who opted in to texts and have a phone number will receive it.</div></div>' +
    editorPanel + onboardPanel +
    '<div class="toolbar">' +
      '<input type="search" id="q" placeholder="Search name or email…">' +
      '<select id="area">'+areaOpts+'</select>' +
      '<select id="role"><option value="">Everyone</option><option value="vol">Volunteers</option><option value="lead">Area Leaders</option><option value="event">Event Leads</option><option value="coord">Coordinator</option><option value="liaison">Shelter Liaison</option></select>' +
      '<select id="shift"><option value="">All shifts</option><option value="1">Shift 1 · 6:45–10 AM</option><option value="2">Shift 2 · 9:45 AM–1:15 PM</option><option value="sorting">Clothing Sorting</option><option value="prep">Kitchen Prep</option></select>' +
      '<select id="login"><option value="">Any sign-in</option><option value="in">Signed in</option><option value="never">Not signed in</option></select>' +
      '<span class="count" id="count"></span>' +
    '</div>' +
    '<div class="toolbar" style="margin-top:-4px">' +
      '<button class="btn ghost" id="selall">Select all shown</button>' +
      '<button class="btn ghost" id="clearsel">Clear</button>' +
      '<button class="btn" id="textbtn" disabled>Text selected (0)</button>' +
      '<button class="btn ghost" id="csv">Export CSV</button>' +
      (FLAGS.overseer ? '<button class="btn ghost" id="onboardbtn">Onboard staff</button>' : '') +
    '</div>' +
    '<div id="tablewrap"></div>';

  function filtered() {
    const q = $("q").value.trim().toLowerCase();
    const area = $("area").value, role = $("role").value, shift = $("shift").value, login = $("login").value;
    return PEOPLE.filter(p => {
      if (role === "vol" && p.role) return false;
      if (role === "lead" && p.role !== "Area Leader") return false;
      if (role === "event" && p.role !== "Event Lead") return false;
      if (role === "liaison" && p.role !== "Shelter Liaison") return false;
      // Login filters apply to backend users (leaders) only.
      if (login === "in" && !(p.role && p.lastLoginAt)) return false;
      if (login === "never" && !(p.role && !p.lastLoginAt)) return false;

      const shifts = p.shifts || [];
      const pAreas = p.areaIds || [];
      const realArea = area && area !== "__none" ? area : "";
      // Area leaders cover the whole event, so they count as being on BOTH shifts
      // (1 & 2) of every area they lead, on top of any explicit shift rows.
      const isLeader = p.role === "Area Leader";
      const coversAreaShift = (aid, sh) =>
        shifts.some(s => s.areaId === aid && s.shift === sh) ||
        (isLeader && (sh === "1" || sh === "2") && pAreas.includes(aid));
      const coversShift = (sh) =>
        shifts.some(s => s.shift === sh) ||
        (isLeader && (sh === "1" || sh === "2") && pAreas.length > 0);
      // Area + shift must describe the SAME assignment row. Otherwise someone in
      // Clothing (shift 1) + Boutique (shift 2) wrongly matches "Boutique, shift 1".
      if (realArea && shift) {
        if (!coversAreaShift(realArea, shift)) return false;
      } else {
        if (shift && !coversShift(shift)) return false;
        if (area === "__none" && pAreas.length) return false;
        if (realArea && !pAreas.includes(realArea)) return false;
      }
      if (q) {
        const hay = ((p.firstName||"")+" "+(p.lastName||"")+" "+(p.email||"")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function render() {
    const rows = filtered();
    const leaders = PEOPLE.filter(p => p.role);
    const signedIn = leaders.filter(p => p.lastLoginAt).length;
    const loginSummary = leaders.length ? ' · leaders active: ' + signedIn + '/' + leaders.length : '';
    $("count").textContent = rows.length + " of " + PEOPLE.length + loginSummary;
    const body = rows.map(p => {
      const name = esc(p.firstName||"") + " " + esc(p.lastName||"");
      const tagClass = p.role==="Event Lead" ? "event" : (p.role==="Volunteer Coordinator" ? "coord" : (p.role==="Shelter Liaison" ? "liaison" : "lead"));
      const tag = p.role ? ' <span class="tag '+tagClass+'">'+esc(p.role)+'</span>' : '';
      const contact = [p.email, p.phone].filter(Boolean).map(esc).join('<br>') || '<span class="muted small">—</span>';
      const consent = p.smsConsent ? '' : ' <span class="small muted">(no SMS)</span>';
      // One line per shift: window + assigned area (or Awaiting) + their 1st/2nd
      // preference while unassigned, so Vickie can place them at a glance.
      // Area leaders cover the whole event, so show them on BOTH shifts of every
      // area they lead — not whatever single shift-row they happen to have.
      let status;
      if (p.role === "Area Leader" && (p.areaIds||[]).length) {
        status = (p.areaIds||[]).map(aid =>
          ["1","2"].map(sh => '<div class="shiftline"><b class="small">'+SHIFTW[sh]+'</b> '+areaPill(aid)+'</div>').join('')
        ).join('');
      } else {
        const shifts = (p.shifts && p.shifts.length) ? p.shifts : [{shift:null,areaId:null,choice1:p.choice1,choice2:p.choice2}];
        status = shifts.map(s => {
          const win = s.shift ? '<b class="small">'+SHIFTW[s.shift]+'</b> ' : '';
          const area = s.areaId ? areaPill(s.areaId) : (p.role ? '<span class="muted small">—</span>' : '<span class="pill wait">Awaiting</span>');
          return '<div class="shiftline">'+win+area+'</div>';
        }).join('');
      }
      // Intake answers (comments, qualifiers, etc.) help place someone, so show
      // them only while a shift is still unassigned. Once fully assigned, the row
      // collapses to just name / contact / shift-area.
      const minorTag = p.minor ? ' <span class="tag minor">Minor</span>' : '';
      const noteDisplay = p.note ? '<div class="rec-note">'+esc(p.note)+'</div>' : '';
      const checked = selected.has(p.id) ? ' checked' : '';
      const actions = CAN_EDIT ? '<td><button class="rowbtn" data-edit="'+p.id+'">Edit</button></td>' : '';
      return '<tr><td class="sel"><input type="checkbox" data-id="'+p.id+'"'+checked+'></td>' +
        '<td><b>'+name+'</b>'+tag+minorTag+consent+loginBadge(p)+noteDisplay+'</td>' +
        '<td class="small">'+contact+'</td><td>'+status+'</td>'+actions+'</tr>';
    }).join("");
    const editTh = CAN_EDIT ? '<th></th>' : '';
    $("tablewrap").innerHTML = rows.length
      ? '<table><thead><tr><th class="sel"></th><th>Name</th><th>Contact</th><th>Assignment</th>'+editTh+'</tr></thead><tbody>'+body+'</tbody></table>'
      : '<div class="empty">No one matches those filters.</div>';
    updateTextBtn();
  }

  function updateTextBtn() {
    $("textbtn").textContent = "Text selected ("+selected.size+")";
    $("textbtn").disabled = selected.size === 0;
  }

  ["q","area","role","shift","login"].forEach(id => $(id).addEventListener("input", render));

  $("tablewrap").addEventListener("change", e => {
    const cb = e.target.closest("input[type=checkbox]");
    if (!cb) return;
    const id = Number(cb.dataset.id);
    if (cb.checked) selected.add(id); else selected.delete(id);
    updateTextBtn();
  });
  $("selall").onclick = () => { filtered().forEach(p => selected.add(p.id)); render(); };
  $("clearsel").onclick = () => { selected.clear(); render(); };

  // CSV export of the current filtered view
  $("csv").onclick = () => {
    const rows = filtered();
    const head = ["First Name","Last Name","Email","Phone","SMS Consent","Role","Shifts","Assigned areas","Preferences","Note"];
    const cell = (s) => '"' + String(s==null?"":s).replace(/"/g,'""') + '"';
    const sh = (p) => (p.shifts && p.shifts.length) ? p.shifts : [{shift:null,areaId:null,choice1:p.choice1,choice2:p.choice2}];
    const tag = (s) => s.shift ? SHIFTW[s.shift]+": " : "";
    const lines = [head.map(cell).join(",")].concat(rows.map(p => {
      const S = sh(p);
      const shifts = S.map(s => s.shift ? SHIFTW[s.shift] : "").filter(Boolean).join("; ");
      const areas = S.map(s => s.areaId ? tag(s)+areaName(s.areaId) : "").filter(Boolean).join("; ");
      const prefs = S.map(s => (!s.areaId && (s.choice1||s.choice2)) ? tag(s)+"1st "+(s.choice1||"-")+(s.choice2?", 2nd "+s.choice2:"") : "").filter(Boolean).join("; ");
      return [p.firstName,p.lastName,p.email,p.phone,p.smsConsent?"Yes":"No",p.role||"Volunteer",shifts,areas,prefs,p.note||""].map(cell).join(",");
    }));
    const blob = new Blob([lines.join("\\n")], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "blessfest-directory.csv"; a.click();
    URL.revokeObjectURL(a.href);
  };

  // ---- Texting ----
  $("textbtn").onclick = () => {
    $("c-count").textContent = selected.size + " selected";
    $("composer").classList.remove("hide");
    $("c-status").textContent = ""; $("c-status").className="status";
    $("c-body").focus();
  };
  $("c-cancel").onclick = () => $("composer").classList.add("hide");
  $("c-send").onclick = async () => {
    const body = $("c-body").value.trim();
    if (!body) { $("c-status").textContent="Write a message first"; $("c-status").className="status err"; return; }
    if (!confirm("Text "+selected.size+" selected people (those who opted in)?")) return;
    $("c-send").disabled = true; $("c-status").textContent="Sending…"; $("c-status").className="status";
    try {
      const res = await fetch("/admin/people/text", {method:"POST",headers:{"content-type":"application/json"},
        body: JSON.stringify({ volunteerIds:[...selected], body })});
      const o = await res.json();
      if (o.error) throw new Error(o.error);
      const skipped = (o.noConsent||0)+(o.noPhone||0)+(o.offTeam||0);
      $("c-status").textContent = "Texted "+o.sent + (skipped?(" · skipped "+skipped):"");
      $("c-status").className="status ok";
      $("c-body").value="";
    } catch(err) { $("c-status").textContent=err.message; $("c-status").className="status err"; }
    finally { $("c-send").disabled=false; }
  };

  // ---- Edit / reassign / delete (assigners only) ----
  if (CAN_EDIT) {
    let editing = null;
    const openEditor = (p) => {
      editing = p;
      $("e-name").textContent = (p.firstName||"") + " " + (p.lastName||"");
      $("e-area").value = (p.areaIds && p.areaIds[0]) || areas[0].id;
      $("e-shift").value = "";
      $("e-note").value = p.note || "";
      $("e-status").textContent = ""; $("e-status").className = "status";
      $("e-notestatus").textContent = ""; $("e-notestatus").className = "status";
      $("editor").classList.remove("hide");
      $("editor").scrollIntoView({behavior:"smooth", block:"center"});
    };
    $("tablewrap").addEventListener("click", e => {
      const b = e.target.closest("[data-edit]");
      if (!b) return;
      const p = PEOPLE.find(x => x.id === Number(b.dataset.edit));
      if (p) openEditor(p);
    });
    $("e-cancel").onclick = () => { editing = null; $("editor").classList.add("hide"); };
    $("e-savenote").onclick = async () => {
      if (!editing) return;
      const st = $("e-notestatus");
      $("e-savenote").disabled = true; st.textContent = "Saving…"; st.className = "status";
      try {
        const res = await fetch("/admin/people/edit", {method:"POST", headers:{"content-type":"application/json"},
          body: JSON.stringify({ action:"note", volunteerId: editing.id, note: $("e-note").value })});
        const o = await res.json();
        if (o.error) throw new Error(o.error);
        editing.note = ($("e-note").value||"").trim();
        st.textContent = "Saved"; st.className = "status ok";
        await refresh();
      } catch(err){ st.textContent = err.message; st.className = "status err"; }
      finally { $("e-savenote").disabled = false; }
    };
    $("e-save").onclick = async () => {
      if (!editing) return;
      const areaId = $("e-area").value;
      const shift = $("e-shift").value; // '' = keep current
      const sameArea = (editing.areaIds||[]).includes(areaId);
      if (sameArea && !shift) { $("e-status").textContent="Already on that team — pick a shift to change it"; $("e-status").className="status err"; return; }
      const shiftLbl = shift==="1" ? " on Shift 1" : shift==="2" ? " on Shift 2" : "";
      const verb = sameArea ? ("Set "+($("e-name").textContent)+shiftLbl+" for "+areaName(areaId)) : ("Reassign "+($("e-name").textContent)+" to "+areaName(areaId)+shiftLbl);
      if (!confirm(verb+"? This sends them a new onboarding email/text.")) return;
      $("e-save").disabled = true; $("e-status").textContent="Saving…"; $("e-status").className="status";
      try {
        const res = await fetch("/admin/people/edit",{method:"POST",headers:{"content-type":"application/json"},
          body: JSON.stringify({ action:"reassign", volunteerId: editing.id, areaId, areaName: areaName(areaId), shift })});
        const o = await res.json();
        if (o.error) throw new Error(o.error);
        const bits = Object.entries(o.sent||{}).map(([k,v]) => k+" "+v).join(", ");
        $("e-status").textContent = "Reassigned"+(bits?(" — notified: "+bits):""); $("e-status").className="status ok";
        await refresh();
        setTimeout(() => $("editor").classList.add("hide"), 1200);
      } catch(err){ $("e-status").textContent=err.message; $("e-status").className="status err"; }
      finally { $("e-save").disabled=false; }
    };
    $("e-del").onclick = async () => {
      if (!editing) return;
      if (!confirm("Permanently delete "+($("e-name").textContent)+"? This removes them and their team-page link. This cannot be undone.")) return;
      $("e-del").disabled = true; $("e-status").textContent="Deleting…"; $("e-status").className="status";
      try {
        const res = await fetch("/admin/people/edit",{method:"POST",headers:{"content-type":"application/json"},
          body: JSON.stringify({ action:"delete", volunteerId: editing.id, ids: editing.ids })});
        const o = await res.json();
        if (o.error) throw new Error(o.error);
        editing = null; $("editor").classList.add("hide");
        await refresh();
      } catch(err){ $("e-status").textContent=err.message; $("e-status").className="status err"; }
      finally { $("e-del").disabled=false; }
    };
  }

  // ---- Onboard leaders (overseers only) ----
  if (FLAGS.overseer) {
    let loaded = false;
    $("onboardbtn").onclick = async () => {
      $("onboard").classList.remove("hide");
      $("onboard").scrollIntoView({behavior:"smooth", block:"center"});
      if (loaded) return;
      $("ob-body").innerHTML = "Loading preview…";
      try {
        const o = await (await fetch("/admin/leaders/onboard",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode:"preview"})})).json();
        if (o.error) throw new Error(o.error);
        loaded = true;
        const rows = (o.recipients||[]).map(r =>
          '<label style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid var(--line)">'+
          '<input type="checkbox" class="ob-cb" value="'+r.id+'" style="margin-top:3px">'+
          '<span><b>'+esc(r.name)+'</b>'+(r.role?' <span class="tag '+(r.role==="Event Lead"?"event":(r.role==="Volunteer Coordinator"?"coord":(r.role==="Shelter Liaison"?"liaison":"lead")))+'">'+esc(r.role)+'</span>':'')+(r.areas.length?' — '+esc(r.areas.join(", ")):'')+'<br>'+
          (r.willEmail?'<span class="pill done">email ✓</span>':'<span class="pill wait">no email</span>')+
          (r.willText?' <span class="pill done">will also text</span>':'')+'</span></label>').join("");
        $("ob-body").innerHTML =
          '<div style="margin-bottom:8px">Check the staff you want to onboard now, then send. Each gets an email for their role (area leads → team page, event leads → admin dashboard, coordinator → queue) with an activation link. Nothing sends until you click below.</div>'+
          '<div style="margin-bottom:8px"><button class="rowbtn" id="ob-all">Select all</button> <button class="rowbtn" id="ob-none">Clear</button></div>'+
          rows+
          (o.sample?'<div style="margin-top:12px"><b>Sample email — '+esc(o.sample.subject)+'</b><pre class="sample">'+esc(o.sample.text)+'</pre></div>':'');
        const cbs = () => Array.from(document.querySelectorAll(".ob-cb"));
        const upd = () => { const n = cbs().filter(c=>c.checked).length; $("ob-send").disabled = n===0; $("ob-send").textContent = "Send to "+n+" selected"; };
        $("ob-body").addEventListener("change", e => { if (e.target.classList.contains("ob-cb")) upd(); });
        $("ob-all").onclick = () => { cbs().forEach(c=>c.checked=true); upd(); };
        $("ob-none").onclick = () => { cbs().forEach(c=>c.checked=false); upd(); };
        upd();
      } catch(err){ $("ob-body").textContent = err.message; }
    };
    $("ob-cancel").onclick = () => $("onboard").classList.add("hide");
    $("ob-send").onclick = async () => {
      const ids = Array.from(document.querySelectorAll(".ob-cb")).filter(c=>c.checked).map(c=>Number(c.value));
      if (!ids.length) return;
      if (!confirm("Send the onboarding email now to "+ids.length+" selected leader(s)?")) return;
      $("ob-send").disabled = true; $("ob-status").textContent="Sending…"; $("ob-status").className="status";
      try {
        const o = await (await fetch("/admin/leaders/onboard",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode:"send", ids})})).json();
        if (o.error) throw new Error(o.error);
        $("ob-status").textContent = "Emailed "+o.emailed+(o.texted?(" · texted "+o.texted):"")+(o.skipped?(" · "+o.skipped+" already sent"):"")+(o.failed?(" · "+o.failed+" failed"):"");
        $("ob-status").className="status ok";
        // Uncheck the ones we just sent so a second click doesn't re-send.
        Array.from(document.querySelectorAll(".ob-cb")).forEach(c => { if (ids.includes(Number(c.value))) c.checked = false; });
      } catch(err){ $("ob-status").textContent=err.message; $("ob-status").className="status err"; }
      finally { $("ob-send").disabled = Array.from(document.querySelectorAll(".ob-cb")).filter(c=>c.checked).length===0; }
    };
  }

  render();
})();
`;
