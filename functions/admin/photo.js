/* GET/POST /admin/photo — any signed-in staff member (area lead, event lead,
   coordinator, admin) can upload, change, or remove their own headshot here.
   The photo is stored on their volunteer row(s) by email, so it flows to the
   team portal and the Event Team page automatically. Session-gated (no token). */

import { identify, AuthUnavailable } from "../_shared/auth.js";
import { isKnownUser } from "../_shared/owners.js";
import { loginHtml } from "../_shared/loginpage.js";

const MAX_PHOTO_LEN = 900_000; // ~650 KB; the browser resizes well under this.

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return html(`<div class="card"><h1>Sign-in unavailable</h1></div>`, 503);
    throw err;
  }
  if (!email) return new Response(loginHtml("My Photo"), { headers: { "content-type": "text/html; charset=utf-8" } });
  if (!isKnownUser(email)) return html(`<div class="card"><h1>Not authorized</h1></div>`, 403);

  const row = await env.ROSTER.prepare(
    "SELECT first_name, last_name, photo FROM volunteers WHERE lower(email) = ? LIMIT 1",
  ).bind(email.toLowerCase()).first();
  const name = row ? [row.first_name, row.last_name].filter(Boolean).join(" ").trim() : email;
  return html(page(name, (row && row.photo) || ""), 200);
}

export async function onRequestPost({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    if (err instanceof AuthUnavailable) return json({ error: "sign-in unavailable" }, 503);
    throw err;
  }
  if (!email || !isKnownUser(email)) return json({ error: "not authorized" }, 403);

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }

  if (b.remove) {
    await env.ROSTER.prepare("UPDATE volunteers SET photo = NULL WHERE lower(email) = ?").bind(email.toLowerCase()).run();
    return json({ ok: true, removed: true });
  }

  const raw = b.photo == null ? "" : String(b.photo);
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
    return json({ error: "That photo isn't a supported image." }, 400);
  }
  if (raw.length > MAX_PHOTO_LEN) {
    return json({ error: "That photo is too large — please pick a smaller one." }, 400);
  }
  await env.ROSTER.prepare("UPDATE volunteers SET photo = ? WHERE lower(email) = ?").bind(raw, email.toLowerCase()).run();
  return json({ ok: true });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function page(name, photoUrl) {
  const initials = String(name).split(/[^A-Za-z]/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("") || "★";
  const avatar = photoUrl
    ? `<img id="pv" class="avatar" src="${esc(photoUrl)}" alt="Your photo">`
    : `<div id="pv" class="avatar empty"><span>${esc(initials)}</span></div>`;
  return `<div class="card"><a class="back" href="/admin/team">← Back</a>` +
    `<h1>Your photo</h1>` +
    `<p class="muted">Hi ${esc(name)} — this headshot shows on your team's page and the Event Team page. Upload one, change it, or remove it anytime.</p>` +
    `<div class="photorow">${avatar}<label class="filebtn">Choose photo<input id="photo" type="file" accept="image/*" hidden></label></div>` +
    `<div class="row"><button id="save" disabled>Save photo</button>` +
    (photoUrl ? `<button id="remove" class="ghost">Remove</button>` : "") +
    `<span class="status" id="st"></span></div>` +
    `<p class="fine">Square-ish photos look best. We resize it in your browser before uploading.</p></div>`;
}

const html = (inner, status) =>
  new Response(shell(inner), { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

function shell(inner) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>My Photo — BlessFest 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--bg2:#f3ede4;--orange:#d97757;--orange-deep:#c15f3f;--orange-soft:#f6e1d7;--line:#e7e0d6;--muted:#6f6960;--good:#2f7d5d;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);display:grid;place-items:start center;min-height:100vh;padding:40px 16px;}
.card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:28px;width:min(460px,94vw);}
.back{color:var(--muted);text-decoration:none;font-weight:700;font-size:.85rem;}
h1{font-size:1.4rem;margin:10px 0 6px;}p{margin:0 0 14px;}.muted{color:var(--muted);font-size:.92rem;}.fine{color:var(--muted);font-size:.78rem;margin-top:16px;}
.photorow{display:flex;align-items:center;gap:16px;margin:8px 0 4px;}
.avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;border:1px solid var(--line);flex:0 0 auto;background:var(--orange-soft);}
.avatar.empty{display:grid;place-items:center;color:var(--orange-deep);font-weight:900;font-size:1.7rem;}
.filebtn{display:inline-flex;align-items:center;padding:11px 18px;background:var(--bg2);border:1px solid var(--line);border-radius:9px;font-weight:800;font-size:.9rem;cursor:pointer;}
.filebtn:hover{background:var(--line);}
.row{display:flex;align-items:center;gap:12px;margin-top:18px;flex-wrap:wrap;}
button{font-family:inherit;font-weight:800;border:none;border-radius:9px;padding:12px 20px;background:var(--orange);color:#fff;cursor:pointer;}
button:hover{background:var(--orange-deep);}button:disabled{opacity:.5;cursor:default;}
button.ghost{background:transparent;color:var(--orange-deep);border:1px solid var(--line);}
.status{font-size:.9rem;font-weight:600;}.status.ok{color:var(--good);}.status.err{color:var(--orange-deep);}
</style></head><body><main>${inner}</main>
<script>
(() => {
  const fileEl = document.getElementById("photo"), save = document.getElementById("save"),
        st = document.getElementById("st"), removeBtn = document.getElementById("remove");
  if (!fileEl) return;
  let photoData = null;
  async function resize(file){
    const url = URL.createObjectURL(file);
    try{
      const img = new Image();
      await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error("Couldn't read that image."));img.src=url;});
      const max=480; let w=img.naturalWidth,h=img.naturalHeight;
      const s=Math.min(1,max/Math.max(w,h)); w=Math.max(1,Math.round(w*s)); h=Math.max(1,Math.round(h*s));
      const c=document.createElement("canvas"); c.width=w; c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      return c.toDataURL("image/jpeg",0.82);
    } finally { URL.revokeObjectURL(url); }
  }
  fileEl.addEventListener("change", async () => {
    const file = fileEl.files && fileEl.files[0]; if (!file) return;
    st.textContent="Preparing…"; st.className="status";
    try{
      photoData = await resize(file);
      const pv = document.getElementById("pv");
      pv.outerHTML = '<img id="pv" class="avatar" src="'+photoData+'" alt="Your photo">';
      save.disabled=false; st.textContent="Ready — tap Save."; st.className="status ok";
    }catch(e){ st.textContent=e.message; st.className="status err"; }
  });
  save.addEventListener("click", async () => {
    if(!photoData) return;
    save.disabled=true; st.textContent="Saving…"; st.className="status";
    try{
      const o = await (await fetch("/admin/photo",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({photo:photoData})})).json();
      if(o.error) throw new Error(o.error);
      st.textContent="Saved! Your photo is updated everywhere."; st.className="status ok";
    }catch(e){ st.textContent=e.message; st.className="status err"; save.disabled=false; }
  });
  if (removeBtn) removeBtn.addEventListener("click", async () => {
    if(!confirm("Remove your photo?")) return;
    st.textContent="Removing…"; st.className="status";
    try{
      const o = await (await fetch("/admin/photo",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({remove:true})})).json();
      if(o.error) throw new Error(o.error);
      location.reload();
    }catch(e){ st.textContent=e.message; st.className="status err"; }
  });
})();
</script></body></html>`;
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
