/* Email-code login: no external identity provider, no domain needed. An admin
   enters their email, gets a 6-digit code by email (Resend), and exchanges it
   for a signed, HttpOnly session cookie. Sessions are stateless — verified by
   HMAC over {email, exp}, so there's no server-side session store to manage.
   Login codes live in D1 (login_codes) with a short expiry. */

const enc = new TextEncoder();
const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlDecode = (s) => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/* Sign {email, exp} into a cookie-safe token. exp is epoch seconds. */
export async function signSession(secret, email, ttlSeconds = 60 * 60 * 24 * 14) {
  const exp = Math.floor(nowSec() + ttlSeconds);
  const payload = b64url(enc.encode(JSON.stringify({ email: String(email).toLowerCase(), exp })));
  const sig = b64url(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload)));
  return `${payload}.${sig}`;
}

/* Returns the email if the token is valid and unexpired, else null. */
export async function verifySession(secret, token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  let ok;
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), b64urlDecode(sig), enc.encode(payload));
  } catch {
    return null;
  }
  if (!ok) return null;
  let data;
  try {
    data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
  } catch {
    return null;
  }
  if (!data.email || !data.exp || data.exp < nowSec()) return null;
  return data.email;
}

export const COOKIE = "bf_session";
export function sessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 14) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
export function readCookie(request, name) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

/* --- login codes (D1) --- */
export function makeCode() {
  // 6 digits, crypto-random, no modulo bias worth worrying about here.
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, "0");
}

export async function storeCode(env, email, code, ttlSeconds = 600) {
  const expires = new Date((nowMs() + ttlSeconds * 1000)).toISOString();
  await env.ROSTER.prepare(
    `INSERT INTO login_codes (email, code, expires_at, attempts) VALUES (?, ?, ?, 0)
       ON CONFLICT(email) DO UPDATE SET code=excluded.code, expires_at=excluded.expires_at, attempts=0`,
  )
    .bind(String(email).toLowerCase(), code, expires)
    .run();
}

/* Verify+consume a code. Returns true on success. Limits attempts to 5. */
export async function checkCode(env, email, code) {
  const e = String(email).toLowerCase();
  const row = await env.ROSTER.prepare("SELECT code, expires_at, attempts FROM login_codes WHERE email = ?").bind(e).first();
  if (!row) return false;
  if (row.attempts >= 5 || row.expires_at < new Date(nowMs()).toISOString()) {
    await env.ROSTER.prepare("DELETE FROM login_codes WHERE email = ?").bind(e).run();
    return false;
  }
  if (String(row.code) !== String(code).trim()) {
    await env.ROSTER.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?").bind(e).run();
    return false;
  }
  await env.ROSTER.prepare("DELETE FROM login_codes WHERE email = ?").bind(e).run(); // one-time use
  return true;
}

/* Time helpers isolated so Workers' Date usage is in one place. */
const nowMs = () => Date.now();
const nowSec = () => Date.now() / 1000;
