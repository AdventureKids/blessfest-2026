/* AVATAR_WIDGET — a self-contained client snippet dropped into every backend
   page. It shows the signed-in user's photo (or monogram) just left of their
   email in the header; clicking it opens a file picker, resizes in-browser, and
   saves via POST /admin/photo — the same endpoint the old "My Photo" page used.
   Anchors itself to the page's #who element, so no per-page markup is needed. */

export const AVATAR_WIDGET = `
(() => {
  const who = document.getElementById("who");
  if (!who) return;

  const css = ''
    + '.who-av{position:relative;width:32px;height:32px;border-radius:50%;border:1px solid var(--line,#e7e0d6);'
    + 'background:var(--orange-soft,#f6e1d7);color:var(--orange-deep,#c15f3f);display:inline-grid;place-items:center;'
    + 'font-weight:800;font-size:.78rem;cursor:pointer;overflow:hidden;padding:0;flex:0 0 auto;vertical-align:middle;}'
    + '.who-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}'
    + '.who-av .cam{position:absolute;inset:0;background:rgba(0,0,0,.45);color:#fff;display:none;'
    + 'align-items:center;justify-content:center;font-size:.82rem;}'
    + '.who-av:hover .cam{display:flex;}'
    + '.who-av:focus-visible{outline:2px solid var(--orange,#d97757);outline-offset:2px;}'
    + '.who-av.busy{opacity:.55;cursor:default;}'
    + '.who-toast{position:fixed;bottom:18px;right:18px;background:#161412;color:#fff;padding:9px 14px;'
    + 'border-radius:9px;font-size:.82rem;z-index:9999;opacity:0;transition:opacity .2s;pointer-events:none;}'
    + '.who-toast.show{opacity:1;}';
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "who-av";
  btn.id = "who-av";
  btn.title = "Change your photo";
  btn.setAttribute("aria-label", "Change your photo");
  btn.innerHTML = '<span class="mono">&middot;&middot;</span><span class="cam">&#9998;</span>';
  who.parentNode.insertBefore(btn, who);

  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/*";
  file.style.display = "none";
  document.body.appendChild(file);

  const initials = (s) =>
    String(s || "").split(/[^A-Za-z]/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join("") || "\\u2605";

  const setAvatar = (photo, name) => {
    btn.querySelector(".mono").textContent = initials(name);
    let img = btn.querySelector("img");
    if (photo) {
      if (!img) { img = document.createElement("img"); btn.insertBefore(img, btn.firstChild); }
      img.src = photo;
    } else if (img) {
      img.remove();
    }
  };

  const toast = (msg, ok) => {
    let t = document.querySelector(".who-toast");
    if (!t) { t = document.createElement("div"); t.className = "who-toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.style.background = ok === false ? "#c15f3f" : "#161412";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2600);
  };

  let me = null;
  fetch("/admin/photo/me")
    .then((r) => r.json())
    .then((d) => { me = d; if (d && !d.error) setAvatar(d.photo, d.name || d.email); })
    .catch(() => {});

  btn.addEventListener("click", () => { if (!btn.classList.contains("busy")) file.click(); });

  async function resize(f) {
    const url = URL.createObjectURL(f);
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("Couldn't read that image.")); img.src = url; });
      const max = 480;
      let w = img.naturalWidth, h = img.naturalHeight;
      const s = Math.min(1, max / Math.max(w, h));
      w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      return c.toDataURL("image/jpeg", 0.82);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  file.addEventListener("change", async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    btn.classList.add("busy");
    toast("Uploading photo\\u2026");
    try {
      const data = await resize(f);
      const o = await (await fetch("/admin/photo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photo: data }),
      })).json();
      if (o.error) throw new Error(o.error);
      setAvatar(data, me && (me.name || me.email));
      toast("Photo updated!");
    } catch (e) {
      toast(e.message || "Upload failed", false);
    } finally {
      btn.classList.remove("busy");
      file.value = "";
    }
  });
})();
`;
