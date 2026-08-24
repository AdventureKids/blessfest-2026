/* The email-code sign-in screen, served by any admin page when there's no
   valid session. Step 1: enter email -> code emailed. Step 2: enter code ->
   cookie set -> reload into the page you asked for. */

export function loginHtml(title = "BlessFest Admin") {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Sign in — ${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&family=UnifrakturCook:wght@700&display=swap" rel="stylesheet">
<style>
:root{--ink:#161412;--paper:#fff;--bg:#faf7f2;--orange:#d97757;--orange-deep:#c15f3f;--line:#e7e0d6;--muted:#6f6960;--good:#2f7d5d;}
*{box-sizing:border-box;}body{margin:0;font-family:'Archivo',system-ui,sans-serif;background:var(--bg);color:var(--ink);
  display:grid;place-items:center;min-height:100vh;}
.card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:32px;width:min(400px,92vw);}
.mk{font-family:'UnifrakturCook',serif;font-size:1.8rem;color:var(--ink);}
h1{font-size:1.15rem;margin:6px 0 4px;}p.sub{color:var(--muted);font-size:.9rem;margin:0 0 20px;}
label{display:block;font-weight:800;font-size:.8rem;margin:14px 0 6px;}
input{width:100%;font-family:inherit;font-size:1rem;border:1px solid var(--line);border-radius:9px;padding:12px 14px;background:var(--bg);}
input:focus{outline:2px solid var(--orange);background:var(--paper);}
button{width:100%;margin-top:18px;font-family:inherit;font-weight:800;font-size:.95rem;border:none;border-radius:9px;
  padding:13px;background:var(--orange);color:#fff;cursor:pointer;}button:hover{background:var(--orange-deep);}button:disabled{opacity:.5;}
.msg{font-size:.85rem;margin-top:14px;min-height:1.2em;}.msg.err{color:var(--orange-deep);}.msg.ok{color:var(--good);}
.back{background:none;border:none;color:var(--muted);font-size:.82rem;margin-top:12px;cursor:pointer;width:auto;padding:4px;}
.hide{display:none;}
</style></head><body>
<div class="card">
  <div class="mk">BlessFest</div>
  <h1>Admin sign-in</h1>
  <p class="sub">Enter your email and we'll send you a 6-digit code.</p>

  <form id="step-email">
    <label for="email">Email</label>
    <input id="email" type="email" autocomplete="email" placeholder="you@cc-ea.org" required>
    <button type="submit" id="send">Send me a code</button>
  </form>

  <form id="step-code" class="hide">
    <label for="code">6-digit code</label>
    <input id="code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" maxlength="6" required>
    <button type="submit" id="verify">Sign in</button>
    <button type="button" class="back" id="back">← use a different email</button>
  </form>

  <div class="msg" id="msg"></div>
</div>
<script>
(() => {
  const $ = (id) => document.getElementById(id);
  const msg = (t, cls) => { $("msg").textContent = t; $("msg").className = "msg" + (cls?" "+cls:""); };
  let email = "";

  $("step-email").onsubmit = async (e) => {
    e.preventDefault();
    email = $("email").value.trim();
    $("send").disabled = true; msg("Sending…");
    try {
      const r = await fetch("/auth/request-code", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});
      const o = await r.json();
      if (o.error) { msg(o.error, "err"); $("send").disabled=false; return; }
      $("step-email").classList.add("hide"); $("step-code").classList.remove("hide");
      msg("If that email is on the list, a code is on its way. Check your inbox.", "ok");
      $("code").focus();
    } catch { msg("Something went wrong — try again.", "err"); $("send").disabled=false; }
  };

  $("back").onclick = () => {
    $("step-code").classList.add("hide"); $("step-email").classList.remove("hide");
    $("send").disabled=false; msg("");
  };

  $("step-code").onsubmit = async (e) => {
    e.preventDefault();
    $("verify").disabled = true; msg("Checking…");
    try {
      const r = await fetch("/auth/verify-code", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email, code:$("code").value.trim()})});
      const o = await r.json();
      if (o.error) { msg(o.error, "err"); $("verify").disabled=false; return; }
      msg("Signed in — loading…", "ok");
      location.reload();
    } catch { msg("Something went wrong — try again.", "err"); $("verify").disabled=false; }
  };
})();
</script>
</body></html>`;
}
