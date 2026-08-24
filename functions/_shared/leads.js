/* Team-lead contact shown on the token-gated team portal. Kept SERVER-SIDE
   (not in data.js, which is public) — it's only rendered behind a volunteer's
   token. Leaders are being told their name + email will appear here.

   `emails` is an array so co-led areas show both. Names/emails match the 2026
   roster; area ids match data.js. */

export const LEADS = {
  hair: { name: "Tanya Cox", emails: ["mrstycox@gmail.com"] },
  nails: { name: "Sandra Angulo & Diana Lopez", emails: ["mrssandraangulo@gmail.com", "dianalopez1977@yahoo.com"] },
  clothing: { name: "Kyle Poffenberger", emails: ["kyle.poffenberger@cc-ea.org"] },
  boutique: { name: "Becky Kopeny", emails: ["becky.kopeny@cc-ea.org"] },
  craft: { name: "Susan Bauerle", emails: ["susan.bauerle@cc-ea.org"] },
  "food-prep": { name: "Zack Moore", emails: ["zack.moore@cc-ea.org"] },
  "food-service": { name: "David & Sunny Barrs", emails: ["davidbarrs@yahoo.com", "sunnyday1@silverlion.net"], sharedPhoto: true },
  photobooth: { name: "Rod Shimasaki", emails: ["rshimasaki@sbcglobal.net"] },
  "transportation-team": { name: "Michael Irwin", emails: ["micirwin@yahoo.com"] },
  "dining-room": { name: "KC Mercer", emails: ["kingc67@yahoo.com"] },
  janitorial: { name: "Pastor Jim Richards", emails: ["Jim.Richards@cc-ea.org"] },
  "prayer-evangelism": { name: "Pastor Ozzie & Joe McGuire", emails: ["ozzie.castillo@cc-ea.org", "mcguire7576@gmail.com"] },
  "welcome-greeter": { name: "Josh Teasley", emails: ["josh.teasley@cc-ea.org"] },
  "guest-check-in": { name: "Rachael Kinoshita", emails: ["Rachael.Kinoshita@cc-ea.org"] },
  "childrens-ministry": { name: "Christena Mancino & Roz Galvez", emails: ["christena.mancino@cc-ea.org", "roz.galvez@cc-ea.org"] },
  dental: { name: "Kent Toca", emails: ["drkentjt@yahoo.com"] },
  optometry: { name: "Katie Kinoshita", emails: ["katie.kinoshita@gmail.com"] },
  "legal-services": { name: "Mark Schneider", emails: ["goclimbit@gmail.com"] },
  "setup-team": { name: "Vinson Lui", emails: ["Vinson.Lui@cc-ea.org"] },
  "tear-down-team": { name: "Vinson Lui", emails: ["Vinson.Lui@cc-ea.org"] },
  "first-response": { name: "Tony Gonzales", emails: ["Tony.Gonzalesty@gmail.com"] },
  "emergency-response": { name: "Scott Wiedensohler", emails: ["Scott.Wiedensohler@cc-ea.org"] },
  "volunteer-check-in": { name: "Vickie Wright", emails: ["Vickie.Wright@cc-ea.org"] },
};

export const leadFor = (areaId) => LEADS[areaId] || null;
