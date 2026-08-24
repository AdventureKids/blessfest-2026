/* Generates one plain-text copy-review packet per area, straight from
   data.js, for emailing to that area's lead.

   Usage:  node tools/make-copy-review.mjs
   Output: copy-review/<area-id>.txt  (+ copy-review/INDEX.txt)

   Re-run it any time data.js changes — the packets are derived, never
   hand-edited. When a lead sends edits back, apply them to data.js. */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "copy-review");
const SITE = "https://blessfest-2026.pages.dev";

const DEADLINE = null; // e.g. "Friday, August 7" — null omits the ask entirely
const SENDER = "Christian";

/* Roles on the leadership roster that deliberately have NO page on the site.
   Every reviewer sees this, so nobody assumes their area was forgotten. */
const NOT_LISTED = {
  support:
    "Legal, Formstack, Media / MC / Music, AV, Worship, Video / Photo, " +
    "Volunteer Registration, Volunteer Placement / Name Tags, First Response, " +
    "Emergency Response, Shelter Contact / Transportation, Hygiene Kit Collection, " +
    "and Photobooth",
  partners: "Ketchum, Starbucks, WCHS, and Lestonnac",
};

/* From the "BlessFest Leaders 2026" spreadsheet.
     lead      — who receives and fills out the packet
     emails[]  — where to send it (some areas are co-led)
     oversight — the overseer they report to
     location  — where the area runs on the day
   Roles in that sheet with no page on the site (Optometry, Photobooth, Legal,
   Formstack, AV, Worship, Hygiene Kits, Volunteer Registration/Placement,
   First/Emergency Response, Transportation) are intentionally absent — see
   CLAUDE.md. Vendors (Ketchum, Starbucks, WCHS, Lestonnac) are partners, not
   area leads. */
const RYAN = "Pastor Ryan Young";
const JIM = "Pastor Jim Richards";
const BEN = "Ben Goodner";
const CHRISTIAN = "Christian Kopeny";

/* The leadership team. THEY are who the packets go to — not the area leads.
   Each reviews the areas that report to them. */
const REVIEWERS = {
  [CHRISTIAN]: "christian.kopeny@cc-ea.org",
  [BEN]: "ben.goodner@cc-ea.org",
  [JIM]: "Jim.Richards@cc-ea.org",
  [RYAN]: "ryan.young@cc-ea.org",
};

/* Who reviews an area: its overseer — unless one of the four leads it
   directly (Jim leads Janitorial), in which case it's theirs. */
const reviewerFor = (id) => {
  const { lead, oversight } = LEADS[id] || {};
  return lead in REVIEWERS ? lead : oversight;
};

const LEADS = {
  hair: { lead: "Tanya Cox", emails: ["mrstycox@gmail.com"], oversight: BEN,
          location: "Kinder, 3 y/o, 4/5 y/o, Vista Point" },
  nails: { lead: "Sandra Angulo", emails: ["mrssandraangulo@gmail.com"], oversight: CHRISTIAN,
           location: "" },
  clothing: { lead: "Kyle Poffenberger", emails: ["kyle.poffenberger@cc-ea.org"], oversight: JIM,
              location: "Sanctuary" },
  boutique: { lead: "Becky Kopeny", emails: ["becky.kopeny@cc-ea.org"], oversight: CHRISTIAN,
              location: "5th / 6th grade" },
  craft: { lead: "Susan Bauerle", emails: ["susan.bauerle@cc-ea.org"], oversight: CHRISTIAN,
           location: "1st grade" },
  "food-prep": { lead: "Zack Moore", emails: ["zack.moore@cc-ea.org"], oversight: CHRISTIAN,
                 location: "Kitchen" },
  /* Christian's call overrides the sheet here: the sheet has Barrs on "Dining
     Room" and Mercer on "Dining", but Barrs leads Food Service and Mercer
     leads Dining Room Hosts. */
  "food-service": { lead: "David & Sunny Barrs", emails: ["sunnyday1@sliverlion.net"],
                    oversight: CHRISTIAN, location: "Gym" },
  "dining-room": { lead: "KC Mercer", emails: ["kingc67@yahoo.com"], oversight: CHRISTIAN,
                   location: "Gym" },
  janitorial: { lead: JIM, emails: ["Jim.Richards@cc-ea.org"], oversight: RYAN,
                location: "Roaming" },
  "prayer-evangelism": { lead: "Pastor Ozzie & Joe McGuire",
                         emails: ["ozzie.castillo@cc-ea.org", "mcguire7576@gmail.com"],
                         oversight: JIM, location: "Prayer Room" },
  "welcome-greeter": { lead: "Josh Teasley", emails: ["josh.teasley@cc-ea.org"], oversight: BEN,
                       location: "Outside Awning" },
  "guest-check-in": { lead: "Rachael Kinoshita", emails: ["rachaelkinoshita@gmail.com"],
                      oversight: BEN, location: "Outside Awning" },
  "childrens-ministry": { lead: "Christena Mancino & Roz Galvez",
                          emails: ["christena.mancino@cc-ea.org", "roz.galvez@cc-ea.org"],
                          oversight: BEN, location: "JHi and High School" },
  dental: { lead: "Kent Toca", emails: ["drkentjt@yahoo.com"], oversight: CHRISTIAN,
            location: "Adventure Lodge" },
  /* Fully staffed by Marshall B. Ketchum University (partner contact: Dr. Mark
     Nakano, mnakano@ketchum.edu). Katie still reviews the page copy. */
  optometry: { lead: "Katie Kinoshita", emails: ["katie.kinoshita@gmail.com"], oversight: CHRISTIAN,
               location: "Sanctuary" },
  // Vinson runs both ends of the event — setup and strike/reset.
  "setup-team": { lead: "Vinson Lui", emails: ["Vinson.Lui@cc-ea.org"], oversight: RYAN,
                  location: "" },
  "tear-down-team": { lead: "Vinson Lui", emails: ["Vinson.Lui@cc-ea.org"], oversight: RYAN,
                      location: "" },
};

/* data.js is a browser script; give it a window to attach to. */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "data.js"), "utf8"), sandbox);
const { areas, config } = sandbox.window.BLESSFEST;

const rule = (c = "=") => c.repeat(66);
const wide = (c) => c.repeat(132); // index/email files run wider than a packet

/* Greedy wrap at 78 cols. Email body text is assembled from pieces whose
   length varies (one area vs two), so lines can't be hand-broken. */
const wrap = (text, width = 78) =>
  text.split(/\s+/).reduce((lines, word) => {
    const last = lines[lines.length - 1];
    if (last && (last + " " + word).length <= width) lines[lines.length - 1] = last + " " + word;
    else lines.push(word);
    return lines;
  }, []);
const bullets = (list) =>
  list.length ? list.map((x) => `  - ${x}`).join("\n") : "  (nothing listed yet — add anything that applies)";

const section = (n, title, note, body) =>
  [rule("-"), `${n}. ${title.toUpperCase()}`, note ? `   ${note}` : null, "", body, ""]
    .filter((l) => l !== null)
    .join("\n");

function packet(a) {
  const { lead, oversight, location } = LEADS[a.id] || {};
  const shifts = a.commitment.map((c) => `  ${c.day} — ${c.time}`).join("\n");

  /* A partner-staffed area isn't recruiting, so don't ask its lead to describe
     volunteer work that doesn't exist. It gets "who runs it" instead of
     "what you'll do" / "what we need". */
  const staffed = Boolean(a.staffedBy);

  const middle = staffed
    ? [
        section(
          3,
          "Who runs this area",
          "This area is fully staffed by a partner, so the page does NOT ask for volunteers. Correct anything wrong about who provides it.",
          `  ${a.staffedNote}`,
        ),
      ]
    : [
        section(
          3,
          "What you'll do",
          "What a volunteer will actually be doing. Add, remove, or reword freely.",
          bullets(a.whatYoullDo),
        ),
        section(
          4,
          "What we need",
          "The kinds of volunteers or skills you're looking for.",
          bullets(a.needs),
        ),
      ];

  return [
    rule(),
    `BLESSFEST ${config.year} — COPY REVIEW`,
    `AREA: ${a.name}`,
    lead ? `LEAD: ${lead}` : `LEAD: (not yet assigned)`,
    oversight ? `REPORTS TO: ${oversight}` : null,
    location ? `LOCATION: ${location}` : null,
    staffed ? `FULLY STAFFED BY: ${a.staffedBy} (no volunteer sign-up)` : null,
    rule(),
    "",
    `Below is the wording that appears on the ${a.name} page of the BlessFest`,
    "website. Please read it over, fix anything that's wrong, and add anything",
    "that's missing — then send it back.",
    "",
    "Type your changes directly into this document. Don't worry about",
    "formatting, spelling of the headings, or making it look nice; just get the",
    "words right and we'll handle the rest.",
    "",
    `See the page as it looks today:  ${SITE}/#/area/${a.id}`,
    "",
    section(
      1,
      "One-line description",
      "The single sentence shown on the area's card on the homepage.",
      `  ${a.tagline}`,
    ),
    section(
      2,
      "Summary paragraph",
      "The short paragraph at the top of your area's page.",
      `  ${a.summary}`,
    ),
    ...middle,
    section(
      staffed ? 4 : 5,
      "Requirements / good to know",
      "Licenses, background checks, dress code, physical limits. Leave blank if none.",
      bullets(a.requirements),
    ),
    section(
      staffed ? 5 : 6,
      "Shift times",
      "FOR REFERENCE — please don't edit here. If these are wrong, just say so at the bottom.",
      shifts,
    ),
    rule("-"),
    `${staffed ? 6 : 7}. ANYTHING ELSE?`,
    "   Missing shifts, a photo you'd like used, a correction to your name, or",
    "   anything the page should say that it doesn't. Write it here:",
    "",
    "",
    "",
    "",
    rule(),
    "Thanks! — Send this back to Christian.",
    rule(),
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/* Clear only what this script owns. Do NOT nuke the whole directory — the Word
   packets live in copy-review/docx/ and are built by make-copy-review-docx.py. */
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith(".txt") || f.endsWith(".json")) fs.rmSync(path.join(OUT, f));
}

/* First name only — these go to friends and volunteers, not strangers.
   Co-led areas get both ("Christena and Roz"). */
function greeting(lead) {
  const names = lead.split(/\s*&\s*/).map((n) => {
    const parts = n.trim().split(/\s+/);
    // Keep the title on "Pastor Jim" / "Pastor Ozzie"; otherwise first name.
    return /^(pastor|dr\.?)$/i.test(parts[0]) ? parts.slice(0, 2).join(" ") : parts[0];
  });
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
}

/* One email per REVIEWER — a member of the leadership team — covering every
   area that reports to them. `group` is those areas. */
function coverEmail(reviewer, group) {
  const many = group.length > 1;
  const n = group.length;
  const links = group.map((a) => {
    const { lead } = LEADS[a.id];
    return `  ${a.name} (${lead}): ${SITE}/#/area/${a.id}`;
  });
  const staffedHere = group.filter((a) => a.staffedBy);

  const allAreas = areas.map((a) => a.name).join(" · ");

  const paras = [
    `I've drafted the area pages for the BlessFest ${config.year} website — every area of service has its own page where volunteers read what they'd be doing and sign up. Before this goes any further, I'd like the four of us to review the wording.`,
    `${n === 1 ? "The one area" : `The ${n} areas`} that report${n === 1 ? "s" : ""} to you:`,
    links,
    `Attached is one Word document per area with everything that page currently says — the description, what volunteers will do, who's needed, and any requirements. Please correct anything that's wrong or that you'd put differently, and send ${many ? "them" : "it"} back. You can type right into the ${many ? "documents" : "document"} — don't worry about formatting, just get the words right and I'll handle the rest.`,
    ...staffedHere.map(
      (a) =>
        `One exception in your batch: ${a.name} is fully staffed by ${a.staffedBy}, so its page doesn't ask for volunteers at all — it just tells people the service exists. Its document looks a little different, and I was guessing at most of that copy, so it especially needs your eye.`,
    ),

    "———",
    "SO YOU CAN SEE THE WHOLE PICTURE",
    `The site lists ${areas.length} "areas of service" — these are what a volunteer can actually sign up for:`,
    wrap(allAreas, 72).map((l) => `  ${l}`),
    "A number of things on our leadership roster are deliberately NOT on the site, so don't read their absence as an oversight:",
    [
      `  · Support and back-of-house roles we aren't recruiting the public for:`,
      ...wrap(NOT_LISTED.support, 72).map((l) => `      ${l}`),
      "",
      `  · Partner organizations rather than areas of service:`,
      ...wrap(NOT_LISTED.partners, 72).map((l) => `      ${l}`),
      "",
      `  · Optometry IS listed, but flagged "fully staffed" — no sign-up.`,
    ],
    "If you think something in that list deserves its own page — or that something with a page shouldn't have one — tell me and I'll change it.",

    ...(DEADLINE
      ? [`If you can get ${many ? "them" : "it"} back to me by ${DEADLINE}, that would be a big help.`]
      : []),
  ];

  /* An array element is a pre-formatted block (the links); a string gets wrapped. */
  const render = (p) => (Array.isArray(p) ? p : wrap(p));

  /* Gmail rewrites a plain-text body into HTML and throws away the leading
     whitespace, which wrecks the indented lists. So we hand it real HTML and
     keep the text version only as the fallback part. */
  const esc = (s) =>
    String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  const htmlBody = [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222">',
    `<p>Hi ${esc(greeting(reviewer))},</p>`,
    `<p>I've drafted the area pages for the BlessFest ${config.year} website — every area of service has its own page where volunteers read what they'd be doing and sign up. Before this goes any further, I'd like the four of us to review the wording.</p>`,
    `<p><b>${n === 1 ? "The one area" : `The ${n} areas`} that report${n === 1 ? "s" : ""} to you:</b></p>`,
    "<ul>",
    ...group.map((a) => {
      const { lead } = LEADS[a.id];
      const url = `${SITE}/#/area/${a.id}`;
      return `<li><a href="${url}">${esc(a.name)}</a> &mdash; ${esc(lead)}</li>`;
    }),
    "</ul>",
    `<p>Attached is one Word document per area with everything that page currently says — the description, what volunteers will do, who's needed, and any requirements. Please correct anything that's wrong or that you'd put differently, and send ${many ? "them" : "it"} back. You can type right into the ${many ? "documents" : "document"} — don't worry about formatting, just get the words right and I'll handle the rest.</p>`,
    ...staffedHere.map(
      (a) =>
        `<p><b>One exception in your batch:</b> ${esc(a.name)} is fully staffed by ${esc(a.staffedBy)}, so its page doesn't ask for volunteers at all — it just tells people the service exists. Its document looks a little different, and I was guessing at most of that copy, so it especially needs your eye.</p>`,
    ),
    '<hr style="border:none;border-top:1px solid #ddd;margin:22px 0">',
    "<p><b>So you can see the whole picture</b></p>",
    `<p>The site lists ${areas.length} “areas of service” — these are what a volunteer can actually sign up for:</p>`,
    `<p style="padding-left:16px">${esc(allAreas)}</p>`,
    "<p>A number of things on our leadership roster are <b>deliberately not</b> on the site, so don't read their absence as an oversight:</p>",
    "<ul>",
    `<li>Support and back-of-house roles we aren't recruiting the public for: ${esc(NOT_LISTED.support)}.</li>`,
    `<li>Partner organizations rather than areas of service: ${esc(NOT_LISTED.partners)}.</li>`,
    `<li><b>Optometry is listed</b>, but flagged “fully staffed” — no sign-up.</li>`,
    "</ul>",
    "<p>If you think something in that list deserves its own page — or that something with a page shouldn't have one — tell me and I'll change it.</p>",
    ...(DEADLINE ? [`<p>If you can get ${many ? "them" : "it"} back to me by ${esc(DEADLINE)}, that would be a big help.</p>`] : []),
    `<p>Thanks,<br>${esc(SENDER)}</p>`,
    "</div>",
  ].join("\n");

  return {
    to: REVIEWERS[reviewer],
    subject: `BlessFest ${config.year} — review the copy for your ${n} area${many ? "s" : ""}`,
    packets: group.map((a) => ({ id: a.id, name: a.name, docx: `${a.id}.docx` })),
    htmlBody,
    body: [
      `Hi ${greeting(reviewer)},`,
      ...paras.flatMap((p) => ["", ...render(p)]),
      "",
      "Thanks,",
      SENDER,
    ].join("\n"),
  };
}

/* The same email, rendered for the copy-paste file. */
const emailAsText = (e) =>
  [
    `TO:      ${e.to}`,
    `SUBJECT: ${e.subject}`,
    `ATTACH:  ${e.packets.map((p) => `copy-review/docx/${p.docx}`).join("  +  ")}`,
    "",
    e.body,
  ].join("\n");

const index = [];
const gaps = [];
for (const a of areas) {
  const file = `${a.id}.txt`;
  fs.writeFileSync(path.join(OUT, file), packet(a));
  const { lead, emails = [], oversight } = LEADS[a.id] || {};
  if (!lead) gaps.push(`${a.name}: no lead named`);
  if (lead && !emails.length) gaps.push(`${a.name}: no email for ${lead}`);
  index.push(
    `  ${a.name.padEnd(22)} ${(lead || "*** NO LEAD ***").padEnd(32)} ` +
      `${(reviewerFor(a.id) || "*** NO REVIEWER ***").padEnd(21)} ${(emails.join(", ") || "-- need email --").padEnd(50)} ${file}`,
  );
}

/* Group by REVIEWER — the packets go to the four leadership team members, each
   getting the areas that report to them. Not to the ~17 area leads. */
const byReviewer = new Map(Object.keys(REVIEWERS).map((r) => [r, []]));
const unassigned = [];
for (const a of areas) {
  const r = reviewerFor(a.id);
  if (r && byReviewer.has(r)) byReviewer.get(r).push(a);
  else unassigned.push(a.name);
}
if (unassigned.length) gaps.push(`no reviewer for: ${unassigned.join(", ")}`);

const emails = [...byReviewer.entries()]
  .filter(([, group]) => group.length)
  .map(([reviewer, group]) => ({ reviewer, ...coverEmail(reviewer, group) }));

fs.writeFileSync(
  path.join(OUT, "COVER-EMAILS.txt"),
  [
    wide("="),
    `BLESSFEST ${config.year} — COVER EMAILS TO THE LEADERSHIP TEAM`,
    wide("="),
    "",
    `Deadline: ${DEADLINE || "none asked for"}   (set DEADLINE in tools/make-copy-review.mjs)`,
    "",
    "These go to the four of you — NOT to the area leads. Each of you gets the",
    "areas that report to you. Copy a block into your mail client and attach the",
    "packets named in ATTACH.",
    "",
    ...emails.flatMap((e) => ["", wide("-"), "", emailAsText(e), ""]),
  ].join("\n"),
);

/* Same emails, machine-readable — so the Gmail drafts can't drift from what's
   in COVER-EMAILS.txt. */
fs.writeFileSync(path.join(OUT, "drafts.json"), JSON.stringify(emails, null, 2));

/* Everything make-copy-review-docx.py needs to build the Word versions, so the
   .docx packets are generated from data.js too and can't drift from the .txt. */
fs.writeFileSync(
  path.join(OUT, "areas.json"),
  JSON.stringify(
    {
      year: config.year,
      areas: areas.map((a) => {
        const { lead = "", oversight = "", location = "" } = LEADS[a.id] || {};
        return {
          id: a.id,
          name: a.name,
          url: `${SITE}/#/area/${a.id}`,
          lead,
          oversight,
          location,
          reviewer: reviewerFor(a.id) || "",
          staffedBy: a.staffedBy || "",
          staffedNote: a.staffedNote || "",
          tagline: a.tagline,
          summary: a.summary,
          whatYoullDo: a.whatYoullDo,
          needs: a.needs,
          requirements: a.requirements,
          commitment: a.commitment,
        };
      }),
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(OUT, "INDEX.txt"),
  [
    wide("="),
    `BLESSFEST ${config.year} — COPY REVIEW PACKETS (${areas.length} areas)`,
    wide("="),
    "",
    "The packets go to the four REVIEWERS (see COVER-EMAILS.txt), not to the area",
    "leads. When they come back, apply the changes to data.js and re-run:",
    "  node tools/make-copy-review.mjs",
    "",
    "The lead's email is here for later — it's who'd get the page if we ever send",
    "it out to them directly.",
    "",
    `  ${"AREA".padEnd(22)} ${"DIRECT LEAD".padEnd(32)} ${"REVIEWED BY".padEnd(21)} ${"LEAD'S EMAIL".padEnd(50)} FILE`,
    wide("-"),
    ...index,
    "",
    ...(gaps.length ? [wide("-"), `GAPS (${gaps.length}):`, "", ...gaps.map((g) => `  - ${g}`), ""] : ["ALL AREAS HAVE A LEAD AND AN EMAIL.", ""]),
  ].join("\n"),
);

console.log(`Wrote ${areas.length} packets + INDEX.txt to copy-review/`);
