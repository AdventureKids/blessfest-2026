/* GET /admin — the leaders' copy editor.

   The server's only jobs here are to identify the leader and tell the
   page which areas are theirs. The page itself loads the real /data.js
   and /api/content in the browser and builds the form from them, so
   there is no second copy of the content schema to keep in sync. */

import { identify, AuthUnavailable } from "../_shared/auth.js";
import { areasFor, TEXT_FIELDS, LIST_FIELDS, canViewRoster, canAssign, isGuestLiaison } from "../_shared/owners.js";
import { AVATAR_WIDGET } from "../_shared/avatarwidget.js";

const escHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const deny = (msg, status = 403, title = "No access") =>
  new Response(page(`<div class="card"><h1>${title}</h1><p>${msg}</p></div>`, "{}"), {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });

export async function onRequestGet({ request, env }) {
  let email;
  try {
    email = await identify(request, env);
  } catch (err) {
    /* Fail closed: we could not verify, so nobody gets in — but say why,
       because this means the deploy is misconfigured, not that you're
       unauthorized. */
    if (err instanceof AuthUnavailable) {
      return deny(
        `Sign-in is temporarily unavailable. ${escHtml(err.message)}`,
        503,
        "Sign-in unavailable",
      );
    }
    throw err;
  }
  if (!email) return deny("You're not signed in. Open this page through the link you were emailed.");

  const mine = areasFor(email);
  if (mine !== "*" && mine.length === 0) {
    // Area leaders don't edit page copy, but they do have a team home — send them
    // there rather than a dead end.
    if (canViewRoster(email) && !canAssign(email)) {
      return new Response(null, { status: 302, headers: { location: "/admin/team" } });
    }
    if (isGuestLiaison(email)) {
      return new Response(null, { status: 302, headers: { location: "/admin/stats" } });
    }
    return deny(
      `<strong>${escHtml(email)}</strong> isn't assigned to any area yet. Ask Christian to add you.`,
    );
  }

  const boot = JSON.stringify({
    me: email,
    myAreas: mine, // "*" for admins; the page expands it against data.js
    textFields: TEXT_FIELDS,
    listFields: LIST_FIELDS,
  });

  return new Response(page(null, boot), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function page(fallbackBody, boot) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Edit your area — BlessFest 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{
  --ink:#161412; --paper:#ffffff; --bg:#faf7f2; --bg2:#f3ede4;
  --orange:#d97757; --orange-deep:#c15f3f; --orange-soft:#f6e1d7;
  --line:#e7e0d6; --muted:#6f6960; --good:#2f7d5d;
}
*{box-sizing:border-box;}
body{margin:0;font-family:'Archivo',system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55;-webkit-font-smoothing:antialiased;}
header{background:var(--paper);border-bottom:1px solid var(--line);padding:18px 24px;position:sticky;top:0;z-index:10;
  display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;}
header h1{margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.01em;}
header .who{color:var(--muted);font-size:.85rem;}
header nav{display:flex;gap:6px;flex-wrap:wrap;margin-right:auto;}
header nav a{font-size:.85rem;font-weight:700;color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:999px;}
header nav a:hover{color:var(--ink);background:var(--bg2);}
header nav a.on{color:var(--orange-deep);background:var(--orange-soft);}
main{max-width:820px;margin:0 auto;padding:28px 24px 96px;}
.intro{color:var(--muted);font-size:.95rem;margin:0 0 24px;}
.card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:24px;margin-bottom:20px;}
.card h1{margin:0 0 8px;font-size:1.3rem;}
.card > h2{margin:0 0 4px;font-size:1.25rem;font-weight:800;display:flex;align-items:center;gap:10px;}
.card .sub{color:var(--muted);font-size:.85rem;margin:0 0 20px;}
label{display:block;font-weight:800;font-size:.88rem;margin:18px 0 6px;}
label .hint{display:block;font-weight:400;color:var(--muted);font-size:.82rem;margin-top:2px;}
textarea{width:100%;font-family:inherit;font-size:.95rem;line-height:1.6;color:var(--ink);background:var(--bg);
  border:1px solid var(--line);border-radius:10px;padding:12px 14px;resize:vertical;}
textarea:focus{outline:2px solid var(--orange);outline-offset:-1px;background:var(--paper);}
.row{display:flex;gap:10px;align-items:center;margin-top:22px;padding-top:18px;border-top:1px solid var(--line);}
.btn{font-family:inherit;font-weight:800;font-size:.9rem;border-radius:999px;padding:11px 22px;cursor:pointer;border:1px solid transparent;}
.btn-primary{background:var(--orange);color:#fff;}
.btn-primary:hover{background:var(--orange-deep);}
.btn-primary:disabled{opacity:.5;cursor:default;}
.btn-ghost{background:transparent;color:var(--muted);border-color:var(--line);}
.btn-ghost:hover{color:var(--ink);border-color:var(--muted);}
.status{margin-left:auto;font-size:.85rem;font-weight:600;color:var(--muted);}
.status.ok{color:var(--good);}
.status.err{color:var(--orange-deep);}
.edited{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;
  background:var(--orange-soft);color:var(--orange-deep);padding:3px 9px;border-radius:999px;}
.loading{color:var(--muted);padding:40px 0;text-align:center;}
a{color:var(--orange-deep);}
</style>
</head>
<body>
<header>
  <h1>BlessFest 2026</h1>
  <nav><a href="/admin" class="on">Edit copy</a> <a href="/admin/roster">Queue</a> <a href="/admin/people">Directory</a> <a href="/admin/board">Announcements</a> <a href="/admin/stats">Guest RSVPs</a> <a href="/admin/team/preview" target="_blank" rel="noopener">Team preview</a> <a href="/" target="_blank" rel="noopener">View site ↗</a></nav>
  <div class="who" id="who"></div>
</header>
<main id="app">${fallbackBody || '<div class="loading">Loading your areas…</div>'}</main>

<script>window.BOOT = ${boot};</script>
<script src="/data.js"></script>
<script>
(async () => {
  const BOOT = window.BOOT;
  const app = document.getElementById("app");
  if (!BOOT.me) return; // denied page — nothing to wire up

  document.getElementById("who").textContent = "Signed in as " + BOOT.me;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const overrides = await fetch("/api/content").then((r) => r.json()).catch(() => ({}));
  const all = window.BLESSFEST.areas;
  const mine = BOOT.myAreas === "*" ? all : all.filter((a) => BOOT.myAreas.includes(a.id));

  if (!mine.length) {
    app.innerHTML = '<div class="card"><h1>Nothing assigned</h1><p>No areas are assigned to you yet.</p></div>';
    return;
  }

  /* Current value = leader's saved edit if there is one, else data.js. */
  const current = (a, f) => (overrides[a.id] && overrides[a.id][f] !== undefined ? overrides[a.id][f] : a[f]);

  const LABELS = {
    tagline:      ["Tagline", "One sentence. Shows on the area card and at the top of the page."],
    summary:      ["Summary", "A short paragraph describing the area to a would-be volunteer."],
    whatYoullDo:  ["What you'll do", "One bullet per line."],
    needs:        ["What we need", "One bullet per line."],
    requirements: ["Requirements", "One bullet per line. Licenses, background checks, dress code. Leave blank if none."],
  };

  const field = (a, f) => {
    const isList = BOOT.listFields.includes(f);
    const val = current(a, f);
    const text = isList ? (val || []).join("\\n") : (val || "");
    const [title, hint] = LABELS[f];
    return '<label for="' + a.id + '-' + f + '">' + esc(title) +
      '<span class="hint">' + esc(hint) + '</span></label>' +
      '<textarea id="' + a.id + '-' + f + '" data-area="' + a.id + '" data-field="' + f + '" rows="' +
      (isList ? Math.max(3, text.split("\\n").length + 1) : (f === "tagline" ? 2 : 5)) + '">' +
      esc(text) + '</textarea>';
  };

  const fields = [...BOOT.textFields, ...BOOT.listFields];

  app.innerHTML =
    '<p class="intro">Edit the wording for your area below. Changes go live on the site as soon as you save. ' +
    'Shift times, photos, and the area name are set by the admin team — ask Christian to change those.</p>' +
    mine.map((a) =>
      '<section class="card" data-card="' + a.id + '">' +
        '<h2>' + esc(a.name) + (overrides[a.id] ? ' <span class="edited">Edited</span>' : '') + '</h2>' +
        '<p class="sub">Live at <a href="/#/area/' + a.id + '" target="_blank">/#/area/' + esc(a.id) + '</a></p>' +
        fields.map((f) => field(a, f)).join("") +
        '<div class="row">' +
          '<button class="btn btn-primary" data-save="' + a.id + '">Save changes</button>' +
          '<button class="btn btn-ghost" data-reset="' + a.id + '">Reset to original</button>' +
          '<span class="status" data-status="' + a.id + '"></span>' +
        '</div>' +
      '</section>').join("");

  const say = (id, msg, cls) => {
    const el = document.querySelector('[data-status="' + id + '"]');
    el.textContent = msg;
    el.className = "status" + (cls ? " " + cls : "");
  };

  const collect = (id) => {
    const out = {};
    document.querySelectorAll('[data-area="' + id + '"]').forEach((el) => {
      const f = el.dataset.field;
      out[f] = BOOT.listFields.includes(f)
        ? el.value.split("\\n").map((s) => s.trim()).filter(Boolean)
        : el.value.trim();
    });
    return out;
  };

  const post = async (body, id, btn, working, done) => {
    btn.disabled = true;
    say(id, working);
    try {
      const res = await fetch("/admin/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Save failed");
      say(id, done, "ok");
      return true;
    } catch (err) {
      say(id, err.message, "err");
      return false;
    } finally {
      btn.disabled = false;
    }
  };

  app.addEventListener("click", async (e) => {
    const saveBtn = e.target.closest("[data-save]");
    if (saveBtn) {
      const id = saveBtn.dataset.save;
      await post({ area: id, fields: collect(id) }, id, saveBtn, "Saving…", "Saved — it's live");
      return;
    }
    const resetBtn = e.target.closest("[data-reset]");
    if (resetBtn) {
      const id = resetBtn.dataset.reset;
      if (!confirm("Discard your edits to this area and restore the original wording?")) return;
      if (await post({ area: id, reset: true }, id, resetBtn, "Resetting…", "Reset — reloading…")) {
        setTimeout(() => location.reload(), 700);
      }
    }
  });
})();
</script>
<script>${AVATAR_WIDGET}</script>
</body>
</html>`;
}
