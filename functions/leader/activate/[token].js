/* /leader/activate/:token — a leader's tap-to-activate page. The onboarding
   email leads here so an area leader can add their mobile number and immediately
   receive the SAME welcome SMS their volunteers get — a taste of the system.

   GET  -> the phone-entry page (or an "already on" state if they've activated).
   POST -> { phone, photo? }: save phone + SMS consent (and an optional headshot)
           on their row, and text them their team details.

   The token is the capability (same model as the team portal). We only accept
   tokens that resolve to a staff row (area / event leads), so a volunteer's
   portal token can't be used here. */

import { volunteerByToken } from "../../_shared/board.js";
import { setPhoneConsent, recordMessage } from "../../_shared/roster.js";
import { sendSms, toE164 } from "../../_shared/notify.js";
import { welcome, onboarding } from "../../_shared/messages.js";
import { areaName as areaNameFor } from "../../_shared/areas.js";

const SITE = "https://blessfest-2026.pages.dev";

export async function onRequestGet({ params, env }) {
  const now = new Date().toISOString();
  const leader = await resolveLeader(env, params.token, now);
  if (!leader) return page(notFoundCard(), 404);

  const active = Boolean(leader.phone && leader.sms_consent);
  return page(formCard(leader, active), 200);
}

const MAX_PHOTO_LEN = 900_000; // ~650 KB image; client resizes well under this.

export async function onRequestPost({ request, params, env }) {
  const now = new Date().toISOString();
  const leader = await resolveLeader(env, params.token, now);
  if (!leader) return json({ error: "This activation link isn't valid." }, 404);

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }

  // Phone: use what they typed, else keep their existing number (photo-only update).
  const phoneRaw = String(b.phone || "").trim();
  let phone;
  if (phoneRaw) {
    phone = toE164(phoneRaw);
    if (!phone) return json({ error: "Enter a valid US mobile number, e.g. (714) 555-1234." }, 400);
  } else {
    phone = leader.phone;
    if (!phone) return json({ error: "Enter your mobile number to activate texts." }, 400);
  }

  // Optional headshot: a small resized JPEG/PNG data URL from the browser.
  let photo; // undefined = leave existing photo alone
  const rawPhoto = b.photo == null ? "" : String(b.photo);
  if (rawPhoto) {
    // Strict: prefix AND a pure base64 body — so nothing but an image can be
    // stored (the value later lands in an <img src>).
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(rawPhoto)) {
      return json({ error: "That photo isn't a supported image." }, 400);
    }
    if (rawPhoto.length > MAX_PHOTO_LEN) {
      return json({ error: "That photo is too large — please pick a smaller one." }, 400);
    }
    photo = rawPhoto;
  }

  const wasActive = Boolean(leader.phone && leader.sms_consent);
  const phoneChanged = phone !== leader.phone;
  const updated = await setPhoneConsent(env, leader.id, phone, now, photo);

  // Only text on a genuine (re)activation — first time, or a number change — so a
  // photo-only update doesn't re-text an already-active leader.
  let smsStatus = "skipped";
  if (!wasActive || phoneChanged) {
    // Leaders are already assigned, so send their REAL assignment text (with their
    // team-page link), not the "you'll be assigned" welcome. Welcome only if unassigned.
    let body, wave;
    if (updated.area_id) {
      const portalUrl = `${SITE}/team/${params.token}`;
      body = onboarding.sms({
        firstName: updated.first_name, lastName: updated.last_name,
        areaName: areaNameFor(updated.area_id), portalUrl,
      });
      wave = `leader-activate-onboard:${now}`;
    } else {
      body = welcome.sms({ firstName: updated.first_name, lastName: updated.last_name });
      wave = `leader-activate:${now}`;
    }
    const r = await safe(() => sendSms(env, { to: phone, body }));
    await recordMessage(env, {
      volunteerId: updated.id, wave, channel: "sms", toAddr: phone,
      status: r.status, providerId: r.providerId, error: r.error, createdAt: now,
    });
    smsStatus = r.status;
  }

  return json({ ok: true, status: smsStatus, photoSaved: photo !== undefined, texted: !wasActive || phoneChanged, phone });
}

/* Only staff rows (area/event leads) may self-activate through this link. */
async function resolveLeader(env, token, now) {
  const row = await volunteerByToken(env, token, now);
  if (!row || !row.staff_role) return null;
  return row;
}

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const maskPhone = (p) => (p ? "•••• " + String(p).slice(-4) : "");

function notFoundCard() {
  return `<div class="card"><h1>Link not valid</h1><p>This activation link is unknown or has expired. ` +
    `Ask Christian to re-send your leader onboarding email.</p></div>`;
}

function formCard(leader, active) {
  const name = esc([leader.first_name, leader.last_name].filter(Boolean).join(" "));
  if (active) {
    return `<div class="card"><h1>Texts are on ✅</h1>` +
      `<p>You're all set, ${name || "there"} — BlessFest texts are going to <b>${esc(maskPhone(leader.phone))}</b>.</p>` +
      `<p class="muted">Want to add or change your team photo, or update your number? Do it below.</p>` +
      formEl(true, leader.photo) + `</div>`;
  }
  return `<div class="card"><h1>Activate your BlessFest texts</h1>` +
    `<p>Hi ${name || "there"} — enter your mobile number and we'll text you right away ` +
    `with your team details, the <b>same kind of text your volunteers get</b>. You can also add a ` +
    `photo so your team sees a friendly face.</p>` +
    formEl(false, leader.photo) +
    `<p class="fine">By activating you agree to receive BlessFest text updates. Msg &amp; data rates may apply. Reply STOP to opt out anytime.</p></div>`;
}

function formEl(isUpdate, currentPhoto) {
  const pv = currentPhoto
    ? `<img id="pv" class="avatar" src="${esc(currentPhoto)}" alt="Your photo">`
    : `<div id="pv" class="avatar empty">No photo</div>`;
  return `<form id="f">` +
    `<label for="phone">Mobile number${isUpdate ? ' <span class="opt">(leave blank to keep current)</span>' : ""}</label>` +
    `<input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(714) 555-1234"${isUpdate ? "" : " required"}>` +
    `<label>Your photo <span class="opt">(optional)</span></label>` +
    `<div class="photorow">${pv}` +
    `<label class="filebtn">Choose photo<input id="photo" type="file" accept="image/*" hidden></label></div>` +
    `<button type="submit" id="go">${isUpdate ? "Save changes" : "Activate my texts"}</button>` +
    `<p class="status" id="st"></p></form>`;
}

const CLIENT = `
(() => {
  const f = document.getElementById("f");
  if (!f) return;
  const st = document.getElementById("st"), go = document.getElementById("go");
  const phoneEl = document.getElementById("phone"), fileEl = document.getElementById("photo");
  let photoData = null;

  // Resize the chosen image in-browser to a small square-ish JPEG data URL so we
  // never upload a multi-megabyte original.
  async function resize(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("Couldn't read that image.")); img.src = url; });
      const max = 480;
      let w = img.naturalWidth, h = img.naturalHeight;
      const scale = Math.min(1, max / Math.max(w, h));
      w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      return c.toDataURL("image/jpeg", 0.82);
    } finally { URL.revokeObjectURL(url); }
  }

  if (fileEl) fileEl.addEventListener("change", async () => {
    const file = fileEl.files && fileEl.files[0];
    if (!file) return;
    st.textContent = "Preparing photo…"; st.className = "status";
    try {
      photoData = await resize(file);
      const pv = document.getElementById("pv");
      if (pv) pv.outerHTML = '<img id="pv" class="avatar" src="' + photoData + '" alt="Your photo">';
      st.textContent = "Photo ready — tap the button to save."; st.className = "status ok";
    } catch (err) { st.textContent = err.message; st.className = "status err"; }
  });

  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const phone = phoneEl.value.trim();
    if (phoneEl.hasAttribute("required") && !phone) { st.textContent = "Enter your mobile number."; st.className = "status err"; return; }
    go.disabled = true; st.textContent = "Saving…"; st.className = "status";
    try {
      const payload = { phone };
      if (photoData) payload.photo = photoData;
      const res = await fetch(location.pathname, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const o = await res.json();
      if (o.error) throw new Error(o.error);
      let msg;
      if (o.texted && o.status === "sent") msg = "Sent! Check your phone — that's exactly what your team gets. 🎉";
      else if (o.texted) msg = "Saved. Your number is on file; your text will arrive once texting is live.";
      else msg = "Saved!";
      if (o.photoSaved) msg += " Your photo is set.";
      st.textContent = msg; st.className = "status ok";
      go.textContent = "Done";
    } catch (err) { st.textContent = err.message; st.className = "status err"; go.disabled = false; }
  });
})();
`;

function page(inner, status) {
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Activate texts — BlessFest 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--bg2:#f3ede4;--orange:#d97757;--orange-deep:#c15f3f;--line:#e7e0d6;--muted:#6f6960;--good:#2f7d5d;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55;}
main{max-width:520px;margin:0 auto;padding:48px 20px;}
.card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:28px;}
h1{margin:0 0 12px;font-size:1.5rem;}p{margin:0 0 14px;}
.muted{color:var(--muted);font-size:.9rem;}.fine{color:var(--muted);font-size:.78rem;margin-top:16px;}
label{display:block;font-weight:800;font-size:.85rem;margin:14px 0 6px;}
input{width:100%;font-family:inherit;font-size:1.05rem;border:1px solid var(--line);border-radius:10px;padding:13px 14px;background:var(--bg);}
input:focus{outline:2px solid var(--orange);background:var(--paper);}
button{margin-top:16px;width:100%;font-family:inherit;font-weight:800;font-size:1rem;border:none;border-radius:10px;padding:14px;cursor:pointer;background:var(--orange);color:#fff;}
button:hover{background:var(--orange-deep);}button:disabled{opacity:.5;cursor:default;}
.status{font-size:.9rem;font-weight:600;margin-top:12px;min-height:1.2em;}.status.ok{color:var(--good);}.status.err{color:var(--orange-deep);}
.opt{font-weight:400;color:var(--muted);font-size:.82rem;}
.photorow{display:flex;align-items:center;gap:14px;margin-top:2px;}
.avatar{width:64px;height:64px;border-radius:50%;object-fit:cover;border:1px solid var(--line);flex:0 0 auto;}
.avatar.empty{display:grid;place-items:center;background:var(--bg2);color:var(--muted);font-size:.68rem;font-weight:800;}
.filebtn{display:inline-flex;align-items:center;width:auto;margin:0;padding:10px 16px;background:var(--bg2);border:1px solid var(--line);border-radius:9px;font-size:.85rem;font-weight:800;cursor:pointer;color:var(--ink);}
.filebtn:hover{background:var(--line);}
</style></head><body><main>${inner}</main><script>${CLIENT}</script></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

const safe = async (fn) => {
  try { return await fn(); } catch (e) { return { status: "failed", error: String(e).slice(0, 200) }; }
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
