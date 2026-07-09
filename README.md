# Blessfest 2026

Informational site for **Blessfest**, CCEA's Thanksgiving Day outreach — a full
meal, free services, and transportation for neighbors experiencing homelessness.
Homepage plus a page for each of the 16 areas of service. Volunteer links to
Formstack; Give links to Pushpay. Static site, no build step.

Live: https://blessfest-2026.pages.dev

## Files
- `index.html` — layout, styling, and the page renderer (rarely edited).
- `data.js` — **all content**: event details, links, mission copy, needs lists,
  FAQ, and every area's copy, schedule, and photos. Edit this for content.
- `images/areas/` — optimized area photos.
- `CLAUDE.md` — project guide for Claude Code (conventions, photo recipe, deploy).
- `DEPLOY.md` — deploy notes.

## Edit content
Open `data.js`. Each area block has its own `name`, `summary`, `whatYoullDo`,
`commitment` (day/time), `needs`, `requirements`, and `photos`. Save and deploy.

Most areas run two shifts (6:30–10 AM and 9:30 AM–1 PM); Setup and Tear Down
have their own schedules. The three food areas are Food Prep / Kitchen, Food
Service, and Dining Room Hosts.

## Add photos
Drop optimized images in `images/areas/` (resize to ~1600px, aim < 300 KB each)
and reference them in an area's `photos` array:

    photos: [
      { src: "images/areas/hair-1.jpg", caption: "Barbers at work" },
    ]

One photo shows as a single print; two or more fan out into a clickable album.

## Deploy
    npx wrangler pages deploy . --project-name blessfest-2026

## Verify
    node --check data.js

## Planned
A signed-up-volunteer version of the area pages with team-lead contact and
Twilio text updates, reusing this same `data.js`.
