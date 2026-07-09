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

## Photos
- Add to an area's `photos` array:
  `{ src: "images/areas/<file>.jpg", caption: "..." }` (caption is used only as
  alt text now — the UI does not display captions).
- **Optimize every photo before committing.** Recipe (Pillow):
  open → `ImageOps.exif_transpose` → `.convert("RGB")` →
  `.thumbnail((1600, 1600))` → save JPEG `quality=82, optimize=True,
  progressive=True`. Target **< 300 KB** each. Re-save at lower quality if over.
- Naming convention: `<area-id>-1.jpg`, `<area-id>-2.jpg`, etc.
- The gallery renders as a **fanned album of prints** ("See it in action"
  section); one photo shows as a single tilted print, 2+ fan out. Clicking opens
  a lightbox. Areas with no photos omit the section gracefully.

## Deploy
Static site on Cloudflare Pages:
```
npx wrangler pages deploy . --project-name blessfest-2026
```
(Once GitHub↔Pages auto-deploy is set up, a `git push` deploys automatically and
this command is no longer needed.)

## Verify before committing
- `node --check data.js` must pass.
- Quick render sanity check: load `data.js` + the `index.html` script in Node
  with DOM stubs and confirm `homeHtml()` / `areaHtml(area)` produce no
  `undefined` and the expected number of area cards.
- Confirm every `photos[].src` that starts with `images/` actually exists on disk.

## Still to confirm with the client (drafted, not verified)
- `config.address` (street address was a guess), `config.eventDate` / hours.
- `registerUrl` / `shirtUrl` still point at the **2025** Formstack forms.
- Per-area `commitment` times and `requirements` (licenses, background checks).
- Leaders are reviewing each area's copy for corrections.

## Planned (not built yet)
A signed-up-volunteer version of the area pages (team lead contact, Q&A) with
Twilio text updates. It will reuse this same `data.js`; it's a new shell plus a
Worker for messaging.
