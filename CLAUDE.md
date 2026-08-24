# CLAUDE.md — Blessfest 2026 site

Project context for Claude Code. Read this before making changes.

## What this is
A static informational website for **Blessfest**, Calvary Chapel East Anaheim's
(CCEA) Thanksgiving Day outreach to neighbors experiencing homelessness — a full
meal, free services, and transportation from partner shelters. The site has a
homepage plus one page per **area of service**. "Volunteer" links to a Formstack
form; "Give" links to Pushpay. No backend, no database, no build step.

Live at: https://blessfest-2026.pages.dev (Cloudflare Pages, project `blessfest-2026`)

## File structure
- `index.html` — layout, all CSS, and the client-side renderer. The site is a
  hash-routed single page: `#/` is home, `#/area/<id>` is an area page. Rarely
  edited except for design/behavior changes.
- `data.js` — **ALL content lives here.** Event details, links, mission copy,
  needs lists, FAQ, and every area's copy/schedule/photos. This is the file to
  edit for almost any content request. It sets a global `window.BLESSFEST`.
- `images/areas/` — optimized area photos.
- `README.md`, `DEPLOY.md` — human docs.

## How to edit content
Everything is in `data.js`. Each area is an object in `BLESSFEST.areas` with:
`id`, `name`, `icon`, `tagline`, `summary`, `whatYoullDo[]`, `commitment[]`,
`needs[]`, `requirements[]`, `lead`, `photos[]`.

- **Icons**: keys defined in the `ICONS` map inside `index.html`. Reuse an
  existing key; only add a new SVG there if truly needed.
- **Area page URLs** are `#/area/<id>` — changing an `id` breaks its link.

## Conventions (important)
- **Shifts**: every area EXCEPT `setup-team` and `tear-down-team` uses the two
  standard shifts:
  `{ day: "Shift 1", time: "6:30 AM – 10:00 AM" }` and
  `{ day: "Shift 2", time: "9:30 AM – 1:00 PM" }`.
  Setup and Tear Down keep their own multi-day schedules.
- **Em/en dashes**: the file uses real `–`/`—` characters. Preserve them. Do NOT
  run byte-level regex tools (e.g. `perl -pi`) that can double-encode UTF-8 — we
  corrupted the file that way once. Edit with normal string edits.
- **Three food areas** (kept together, in meal order): `food-prep`
  (Food Prep / Kitchen), `food-service` (Food Service), `dining-room`
  (Dining Room Hosts). Don't merge them.
- **Partner-staffed areas**: an area with a `staffedBy` (partner's name) and
  `staffedNote` (a paragraph) renders as an **informational page, not a
  recruiting one** — no "What you'll do", no "Who's needed", no Volunteer
  button; instead a "Who runs this area" block and a "Fully staffed" side card
  that points visitors at areas that *do* need people. Its home card gets a
  "Fully staffed" pill. `whatYoullDo` and `needs` stay as empty arrays.
  Today only `optometry` (Marshall B. Ketchum University) uses this.

## Photos
- **One folder per area** lives in `images/areas/<area-id>/` (folder name = the
  area's `id`). Photo files go inside their area's folder, e.g.
  `images/areas/nails/nails-1.jpg`.
- **Local drag-and-drop preview**: on `localhost`, the area page reads its own
  `images/areas/<id>/` directory listing and shows whatever is in there — no
  `data.js` edit needed to preview. Files show in filename order; the **first
  file is the top (frontmost) photo**. This is localhost-only (it parses the dev
  server's directory listing); the deployed site ignores it. See
  `images/areas/README.txt`.
- **To ship photos** (make them appear on the live site), they must still be
  listed in the area's `photos` array — "bake the folder photos into data.js":
  `{ src: "images/areas/<id>/<file>.jpg", caption: "..." }` (caption is used only
  as alt text now — the UI does not display captions). Keep the array in the
  order you want; first entry renders frontmost.
- **Optimize every photo before committing.** Recipe (Pillow):
  open → `ImageOps.exif_transpose` → `.convert("RGB")` →
  `.thumbnail((1600, 1600))` → save JPEG `quality=82, optimize=True,
  progressive=True`. Target **< 300 KB** each. Re-save at lower quality if over.
- Naming convention: `<area-id>-1.jpg`, `<area-id>-2.jpg`, etc.
- The gallery renders as a **fanned album of prints** ("See it in action"), in
  the **right sidebar above the date/time/location card**; one photo shows as a
  single tilted print, 2+ fan out. Clicking opens a lightbox. Areas with no
  photos omit the section gracefully.

## How the copy gets reviewed (current process)
The **four-person leadership team reviews the copy offline, by email** — Ryan,
Jim, Ben, and Christian. It does **not** go out to the ~17 area leads. There is
no web editor in production.

```
node tools/make-copy-review.mjs
```
Writes to `copy-review/`:
- `<area-id>.txt` — one packet per area, the wording as it currently stands.
- `COVER-EMAILS.txt` — **four** ready-to-send emails, one per reviewer, each
  covering the areas that report to them (Christian 8, Ben 4, Jim 3, Ryan 2).
- `INDEX.txt` — area → lead → reviewer → lead's email, plus a gaps list.

Reviewers type corrections into the plain-text packets and send them back; you
apply the changes to `data.js` and re-run. The packets are **generated from
`data.js`, never hand-edited** — data.js stays the single source of truth.

Who reviews what: `reviewerFor()` uses the area lead's "Report to" from the
leadership spreadsheet — except where one of the four leads an area directly
(Jim leads Janitorial), which they then review themselves.

Everything people-related lives at the top of `tools/make-copy-review.mjs`: the
`LEADS` map (lead, emails, oversight, location), `REVIEWERS` (the four), plus
`DEADLINE` and `SENDER`. The area leads' emails are recorded there but **not
used to send anything today** — they're for later, if pages ever go out to the
leads directly. Shift times are read-only in the packet; reviewers flag problems
in the free-text "anything else" section. Partner-staffed areas get a different
packet (no "what you'll do" / "what we need").

## Parked: the self-serve `/admin` editor (built, NOT deployed)
`functions/` and `wrangler.jsonc` are a complete, tested per-area copy editor —
Cloudflare Access login, per-area permissions enforced server-side, edits in KV
merged over `data.js`, journaled with who/when. They are **untracked and do not
deploy**, and `index.html` has no hook into them.

It's parked on one blocker: **Cloudflare Access can only protect a hostname in
a Cloudflare zone you own.** `cc-ea.org` is on `mygnomehost.com` nameservers,
and the `*.pages.dev` workaround protects the *whole* project (it would put the
public site behind a login). Reviving it needs a domain on Cloudflare — e.g.
buying `blessfest.org` and pointing it at the Pages project. That domain is
worth having anyway for the planned SMS/email links.

If it's revived: `functions/_shared/owners.js` is the only file to edit for
permissions (`ADMINS` = the four overseers, all areas; `OWNERS` = per-area
leads). Set `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` in `wrangler.jsonc` vars (with
a wrangler config present, Pages ignores dashboard-set vars). KV namespace
`CONTENT` already exists: `7f030b9dd7434add813d6de5d380a116`. Local dev:
`npx wrangler pages dev . --kv CONTENT`, with `DEV_EMAIL` in `.dev.vars`
(gitignored) to bypass Access.

## Deploy — IMPORTANT structure
The app (site + roster/portal/board Functions + email-code login) is **LIVE** on
Cloudflare Pages, project `blessfest-2026`, at https://blessfest-2026.pages.dev.

**Only `public/` is served.** `wrangler.jsonc` sets `pages_build_output_dir:
"public"`, which holds `index.html`, `data.js`, `images/`. Everything else —
`wrangler.jsonc`, `schema.sql`, `copy-review/`, `tools/`, `CLAUDE.md`,
`.dev.vars`, `functions/` source — sits at the project ROOT, outside `public/`,
so it is **never published**. `functions/` is still picked up by Pages as
Functions (that's automatic, independent of the output dir).

> ⚠️ Lesson (2026-07-16): the first deploy used output dir `.` and published the
> WHOLE repo — `copy-review/` (lead emails), `schema.sql`, `CLAUDE.md` all went
> public and got stuck in Cloudflare's 7-day edge cache (no purge available for
> `*.pages.dev`). Never set the output dir to the repo root. `.assetsignore` was
> NOT respected by `wrangler pages deploy` — don't rely on it.

Deploy:
```
npx wrangler pages deploy          # reads wrangler.jsonc → uploads public/ only
```
One-time prod setup already done: remote D1 schema applied
(`wrangler d1 execute blessfest-roster --remote --file schema.sql`); secrets set
via `wrangler pages secret put <NAME>` (TWILIO_*, RESEND_*, SESSION_SECRET —
a prod-only random value, NOT the local one). DEV_EMAIL must never be set in prod.

Admin login is **email-code** (session.js / loginpage.js / functions/auth/*):
enter email → 6-digit code via Resend → signed HttpOnly cookie. No domain or
Cloudflare Access needed. Verified working in production. `identify()` in
auth.js reads the cookie; DEV_EMAIL in `.dev.vars` bypasses it locally only.

## Verify before committing
- `node --check data.js` must pass.
- Quick render sanity check: load `data.js` + the `index.html` script in Node
  with DOM stubs and confirm `homeHtml()` / `areaHtml(area)` produce no
  `undefined` and the expected number of area cards.
- Confirm every `photos[].src` that starts with `images/` actually exists on disk.

## Open: leads whose work has no area page
Per the "BlessFest Leaders 2026" sheet, all 17 site areas now have a lead and an
email (see `LEADS` in `tools/make-copy-review.mjs`). But the sheet also names
guest-facing services the site has **no page** for:

- **Photobooth** — Rod Shimasaki, 4th grade room.
- **Hygiene Kit Collection** — Ryan Young (may be pre-event, not a day-of area).

Internal roles with no page, correctly so: Legal, Formstack, Media/MC/Music, AV,
Worship, Volunteer Registration/Placement, First & Emergency Response,
Shelter Contact/Transportation.

Partners, not areas: **Ketchum** (Dr. Mark Nakano), **Starbucks** (Kelly Beard),
**WCHS** (Johnny Trevino), **Lestonnac** (free clinic — no contact named).

Two things the sheet contradicts or leaves loose:
- The sheet puts **David/Sunny Barrs on "Dining Room"** and **KC Mercer on
  "Dining"**. Christian's instruction (2026-07-13) overrides: Barrs leads
  **Food Service**, Mercer leads **Dining Room Hosts**. The code follows
  Christian.
- The Barrs' email in the sheet reads `sunnyday1@sliverlion.net` — "sliverlion"
  looks like a typo for "silverlion". Verify before sending.

The sheet also has a **Location** per area (Sanctuary, Gym, Kitchen, Prayer
Room, Adventure Lodge…). Not on the site today; it's in the review packets, and
would be a good addition to the area pages.

## Still to confirm with the client (drafted, not verified)
- **All of the `optometry` copy** — tagline, summary, and `staffedNote` are
  drafted from the fact that Katie Kinoshita leads it in the Sanctuary and
  Dr. Mark Nakano (mnakano@ketchum.edu) is the Ketchum contact. Nobody has
  confirmed that MBKU brings student clinicians, that glasses (not just exams)
  are provided, or how they want to be named on the page. Katie's review packet
  asks.
- `config.address` (street address was a guess), `config.eventDate` / hours.
- `registerUrl` / `shirtUrl` still point at the **2025** Formstack forms.
- Per-area `commitment` times and `requirements` (licenses, background checks).
- Leaders are reviewing each area's copy for corrections.

## Volunteer roster + two-wave comms (built, tested locally, NOT deployed)
The Formstack → SMS/email workflow. Like the `/admin` editor, these are
untracked local files that do NOT deploy until committed, and the admin pages
need the same login gate (unsolved — see the editor section).

Data: Cloudflare **D1** database `blessfest-roster`
(`5a6665cd-7d29-4f98-9085-cef97c09cc95`), bound as `ROSTER` in `wrangler.jsonc`.
Schema in `schema.sql` (tables: volunteers, messages, tokens, posts). Apply:
`npx wrangler d1 execute blessfest-roster --file schema.sql` (add `--local` for dev).

Flow:
- **Wave 1 (signup):** Formstack fires `POST /api/formstack-webhook`
  (`functions/api/formstack-webhook.js`) → parse submission → normalize phone to
  E.164 → upsert volunteer in D1 (idempotent on Formstack's submission id, so
  webhook retries are safe) → send welcome email (Resend) + welcome SMS (Twilio,
  **only with `sms_consent`**).
- **Admin roster:** `GET /admin/roster` (`functions/admin/roster.js`, admin-only
  via the editor's `auth.js`/`owners.js`) — lists volunteers, assign each to an
  area. Data at `/admin/roster/data`, assignment at `POST /admin/roster/assign`.
- **Wave 2 (assignment):** assign sets `area_id`, mints a portal token, sends the
  onboarding email + SMS with a `…/team/<token>` link.

Senders live in `functions/_shared/notify.js`; copy in `messages.js`; D1 helpers
in `roster.js`. **Every send is a no-op that logs `status:"skipped"` until the
provider env vars are set** — so the whole pipeline runs and is testable with no
accounts. Flip on real delivery by setting secrets, no code change:
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (number or MG… service)
- Resend: `RESEND_API_KEY`, `RESEND_FROM`
- `WEBHOOK_SECRET` (optional): if set, Formstack's webhook URL must include `?key=…`

Local test: `npx wrangler pages dev . --port 8788`, DEV_EMAIL in `.dev.vars`
bypasses admin auth; POST fake submissions to `/api/formstack-webhook`.
**Live Twilio + Resend are wired and verified** (test SMS + email delivered
2026-07-16). Real sends now happen once `.dev.vars`/Pages secrets are set;
Resend sends from the verified `ccea-directory.com` domain.

### Team portal + permissions (built)
- **`/team/<token>`** (`functions/team/[token].js`) — volunteer portal: area
  name + shifts, lead + email, **"What you signed up for"** (summary +
  whatYoullDo from data.js), announcements (pinned first), and a **team roster**
  (first name + last initial only). Bearer-token access.
- **`/admin/board`** — post/pin/delete announcements; **"Text the team"**
  checkbox broadcasts the post via SMS to that area's consented+assigned
  volunteers (each gets their own portal link). Opt-in per post.
- **Permissions** live in `owners.js` (separate from copy-edit rights):
  - `ADMINS` (the 4) — post to any/all areas, assign, edit copy.
  - `AREA_LEADERS` (email→areas) — post to their OWN area's board only.
  - `ASSIGNERS` (+ Vickie Wright) — use `/admin/roster` to assign.
  - Helpers: `postScope`, `canPostToArea`, `canAssign`. Enforced server-side
    (verified: a leader is blocked from other areas, all-areas posts, and the
    roster).
- **Leader contact** shown on the portal is in `leads.js` (server-side, not the
  public data.js). All 17 areas have lead name + email; leaders are being told
  it'll be published. `sunnyday1@sliverlion.net` (Food Service) looks typo'd.
- **1st/2nd area choice**: captured from Formstack (`choice1`/`choice2`), shown
  on the roster, and used to pre-select each volunteer's assign dropdown.

### Still needed to actually go live
- **Field mapping**: `FIELD_MAP` in `formstack-webhook.js` guesses Formstack's
  field labels (incl. `choice1`/`choice2`) — confirm against the real 2026 form
  (which doesn't exist yet; `registerUrl` still points at 2025). The form MUST
  collect phone + an SMS opt-in checkbox + 1st/2nd area choice, captured at signup.
- **Twilio A2P 10DLC registration** — required to text US numbers; takes days to
  weeks; needs the opt-in + privacy policy + STOP/HELP. Start early.
- **A sending domain** for Resend (SPF/DKIM) — `cc-ea.org` isn't on Cloudflare
  ([[ccea-dns-not-on-cloudflare]]); same domain would unlock the Access login.
- **The `/team/<token>` portal** page (message board, pinned meeting, leader
  contact) — the onboarding link's destination. Not built yet.
- **A registration landing page** the Formstack form redirects to
  ("you're registered, awaiting assignment"). Not built yet.
