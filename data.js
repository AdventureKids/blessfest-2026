/* ============================================================
   BLESSFEST 2026 — CONTENT
   This is the only file you need to edit to change copy, links,
   times, and area details. The site builds itself from this.

   >>> THINGS TO CONFIRM / UPDATE (I drafted these — verify them):
     - config.eventDate / time  (set to Thanksgiving Day 2026)
     - config.registerUrl / shirtUrl  (still point at the 2025 forms)
     - Most areas now run two shifts: 6:30 AM–10:00 AM and
       9:30 AM–1:00 PM. Setup and Tear Down keep their own schedules.
     - area.lead is left blank on purpose (used by the future
       signed-up-volunteer version).
   ============================================================ */

window.BLESSFEST = {
  config: {
    year: 2026,
    eventDate: "Thursday, November 26, 2026",   // Thanksgiving Day — confirm
    eventDateShort: "Thanksgiving Day · Nov 26",
    time: "Two shifts · 6:30 AM–10 AM and 9:30 AM–1 PM",  // confirm
    location: "Calvary Chapel East Anaheim",
    address: "5605 E La Palma Ave, Anaheim, CA",

    registerUrl: "https://ccea.formstack.com/forms/blessfest2025",   // update to 2026 form
    donateUrl:   "https://pushpay.com/g/cceamissions?src=hpp",
    shirtUrl:    "https://ccea.formstack.com/forms/blessfest_shirts_2025",
    galleryUrl:  "https://calvarychapeleastanaheim.pixieset.com/blessfest2024/",
    homeUrl:     "https://cc-ea.org/",
  },

  mission: {
    heroLine1: "A seat at the table",
    heroLine2: "for our neighbors.",
    heroSub:
      "Blessfest is our Thanksgiving Day outreach to neighbors experiencing homelessness. We bus guests in from partner shelters, share a full Thanksgiving meal together, and offer free services — all to meet real needs and point to the One who meets every need: Jesus.",
    verseRef: "Romans 12:10 (NIV)",
    verse: "Be devoted to one another in love. Honor one another above yourselves.",
    body:
      "Each Thanksgiving we open the doors of the church to hundreds of guests. Our goal is to meet as many physical needs as possible while caring for the whole person. Every guest can enjoy a complete Thanksgiving meal and free services, and leaves with a new backpack stocked with hygiene items, toiletries, and scripture reminders. Volunteers don't just serve — we sit down and eat together, because everyone deserves to share a table with people who love them.",
    closingVerseRef: "Matthew 25:40",
    closingVerse:
      "Truly, I say to you, as you did it to one of the least of these my brothers, you did it to me.",
  },

  highlights: [
    { label: "Free Thanksgiving meal", detail: "A full, sit-down meal shared together." },
    { label: "Transportation provided", detail: "Guests bused to and from partner shelters." },
    { label: "Free services", detail: "Haircuts, dental, clothing, prayer, and more." },
    { label: "Hygiene backpacks", detail: "Each guest leaves with stocked supplies." },
  ],

  needs: {
    hygieneTitle: "Hygiene kit items",
    hygieneNote: "Travel-size welcome. Collected for guest backpacks.",
    hygiene: ["Soap", "Shampoo", "Deodorant", "Toothpaste", "Toothbrush", "Comb / brush", "Tissue", "Granola bar"],
    clothingTitle: "Cold-weather clothing",
    clothingNote: "Clean and gently used unless noted. Men's & women's adult sizes.",
    clothing: [
      { item: "Underwear", note: "New only · #1 requested · men's M, women's S/M" },
      { item: "Socks", note: "New only · #2 requested · no children's" },
      { item: "Blankets", note: "Clean · we ran out the last two years" },
      { item: "Shoes", note: "Lightly used or new · no sandals, no children's" },
      { item: "Pants", note: "Clean, no shorts · men's & women's L" },
      { item: "Sweaters & coats", note: "Clean · men's & women's" },
      { item: "Blouses & t-shirts", note: "Clean · men's & women's M/L" },
    ],
  },

  faq: [
    { q: "Are all those experiencing homelessness in Orange County invited?",
      a: "No — this year we're partnering with a few local shelters and busing guests in from there." },
    { q: "Do volunteers eat with the guests?",
      a: "Yes. Please come ready to eat. We want our guests to experience a Thanksgiving meal with people who love them — let's break bread together." },
    { q: "What should I bring to volunteer?",
      a: "Your Blessfest shirt and a good attitude. Wearing your shirt is encouraged but not required." },
    { q: "What should I do with my purse?",
      a: "Leave purses and valuables at home or in a safe place. Guests aren't permitted to bring purses into the church, so we ask volunteers to do the same." },
  ],

  /* ---------- AREAS OF SERVICE ----------
     icon keys are defined in index.html (ICONS map).
     Most areas run two shifts; Setup and Tear Down have their own
     schedules below.

     PHOTOS — add past-year photos to any area via its `photos` array:
       photos: [
         { src: "images/areas/hair-1.jpg", caption: "Barbers at work" },
         { src: "https://cc-ea.org/images/.../pic.jpg" },   // caption optional
       ]
     One photo displays large; two or more become a grid you can click to
     enlarge. Put local files in images/areas/ (resize to ~1600px wide,
     aim for <300 KB each), or paste a full URL to a hosted image. */
  areas: [
    {
      id: "hair",
      name: "Hair",
      icon: "scissors",
      tagline: "Free haircuts and styling that help guests feel seen and cared for.",
      summary:
        "A fresh haircut changes how a person feels about their whole day. Our hair team offers free cuts and simple styling in a warm barbershop-and-salon setting, treating every guest with patience and dignity.",
      whatYoullDo: [
        "Cut, trim, and style hair for guests one-on-one",
        "Welcome each guest to your chair and make conversation",
        "Keep your station clean and sanitized between guests",
        "Assist licensed stylists by hosting, sweeping, and managing the line",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Licensed cosmetologists and barbers to cut",
        "Non-licensed helpers to host, sweep, and assist",
      ],
      requirements: [
        "Cutting hair requires a current cosmetology / barber license — confirm with the team lead",
        "Licensed volunteers bring their own clippers and shears if possible",
      ],
      lead: "",
      photos: [],
    },
    {
      id: "nails",
      name: "Nails",
      icon: "sparkle",
      tagline: "Manicures and a few quiet minutes of being pampered.",
      summary:
        "The nails station is often where guests slow down, relax, and talk. Offering a simple manicure is a small luxury that communicates real worth and care.",
      whatYoullDo: [
        "Give guests a basic manicure — clean, trim, file, polish",
        "Sit, listen, and make each guest feel welcome",
        "Sanitize tools and keep the station tidy",
        "Restock polish and supplies as needed",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Licensed nail techs and experienced volunteers",
        "Helpers to host and keep things moving",
      ],
      requirements: [
        "Professional nail services may require a license — confirm with the team lead",
      ],
      lead: "",
      photos: [
        { src: "images/areas/nails-1.jpg", caption: "A manicure — and plenty of laughter" },
        { src: "images/areas/nails-2.jpg", caption: "Careful, personal attention for every guest" },
      ],
    },
    {
      id: "clothing",
      name: "Clothing",
      icon: "shirt",
      tagline: "Help guests pick out clean, warm clothing for the season ahead.",
      summary:
        "Winter is hard on the street. Our clothing area lets each guest 'shop' donated cold-weather clothing and walk out with what they actually need — warm, clean, and their choice.",
      whatYoullDo: [
        "Help guests find their size and style with dignity",
        "Sort, fold, and restock clothing throughout the day",
        "Keep the area organized so it stays easy to shop",
        "Pre-event: sort and size incoming donations",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Helpers who are organized and patient",
        "Donations: see the cold-weather clothing list",
      ],
      requirements: [],
      lead: "",
      photos: [],
    },
    {
      id: "food-prep",
      name: "Food Prep / Kitchen",
      icon: "chef",
      tagline: "Cook, prep, and plate the Thanksgiving meal for hundreds.",
      summary:
        "Behind every plate is the kitchen team. From early-morning cooking to prepping and plating, this crew makes the Thanksgiving meal happen for hundreds of guests and volunteers.",
      whatYoullDo: [
        "Prep and cook the Thanksgiving meal",
        "Plate and stage food for the serving line",
        "Keep the kitchen clean, safe, and moving",
        "Help with food prep the days before, too",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Kitchen-comfortable volunteers and a few experienced cooks",
      ],
      requirements: [
        "Comfort following food-safety basics; closed-toe shoes recommended",
      ],
      lead: "",
      photos: [],
    },
    {
      id: "food-service",
      name: "Food Service",
      icon: "serving",
      tagline: "Work the serving line — plate and run food to every guest.",
      summary:
        "The food service team keeps the line moving. You plate meals, keep the buffet stocked and hot, and make sure every guest walks away with a full Thanksgiving plate.",
      whatYoullDo: [
        "Plate and serve the meal on the line",
        "Keep dishes stocked, hot, and looking great",
        "Run plates to guests who need a hand",
        "Keep the line moving with a smile",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Energetic servers who keep things moving",
        "Friendly faces who work well on a team",
      ],
      requirements: [
        "Gloves provided; comfort standing and serving for a shift",
      ],
      lead: "",
      photos: [
        { src: "images/areas/food-service-1.jpg", caption: "The crew keeping every table fed" },
      ],
    },
    {
      id: "dining-room",
      name: "Dining Room Hosts",
      icon: "utensils",
      tagline: "Host a table — welcome guests, sit down, and share the meal.",
      summary:
        "Dining room hosts are the heart of the room. You welcome guests to their tables, make them feel at home, and sit and eat the meal right alongside them — sharing the table, not just the food.",
      whatYoullDo: [
        "Welcome guests to their tables and get them settled",
        "Sit and eat with guests — share the table, not just the food",
        "Refill drinks, clear plates, and keep tables ready",
        "Create a warm, unhurried Thanksgiving atmosphere",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Warm, hospitable people who love conversation",
        "Come hungry — hosts eat with guests",
      ],
      requirements: [],
      lead: "",
      photos: [],
    },
    {
      id: "janitorial",
      name: "Janitorial",
      icon: "spray",
      tagline: "Keep the whole space clean, safe, and welcoming all day long.",
      summary:
        "A clean, well-kept space tells guests they matter. The janitorial team works behind the scenes all day so every area stays fresh, safe, and ready.",
      whatYoullDo: [
        "Run regular rounds on restrooms and common areas",
        "Empty trash, handle spills, and keep floors clear",
        "Restock restroom and station supplies",
        "Be a quiet, steady presence wherever a need pops up",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Dependable, energetic helpers who notice what's needed",
      ],
      requirements: [],
      lead: "",
      photos: [],
    },
    {
      id: "prayer-evangelism",
      name: "Prayer / Evangelism",
      icon: "heart",
      tagline: "Listen, pray, and share the hope of Jesus, one guest at a time.",
      summary:
        "Every physical need we meet points to a deeper one. The prayer and evangelism team is available all day to listen, pray with guests, and share the gospel with gentleness and love.",
      whatYoullDo: [
        "Pray with guests who want prayer",
        "Have unhurried, caring spiritual conversations",
        "Share the gospel naturally and respectfully",
        "Connect guests to follow-up resources when they're open",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Mature believers comfortable praying with and listening to guests",
      ],
      requirements: [
        "A heart to serve and listen first — training/guidance provided by the lead",
      ],
      lead: "",
      photos: [
        { src: "images/areas/prayer-1.jpg", caption: "Comfort, presence, and prayer" },
        { src: "images/areas/prayer-2.jpg", caption: "Time to stop and pray, one-on-one" },
        { src: "images/areas/prayer-3.jpg", caption: "Lifting up every request together" },
      ],
    },
    {
      id: "welcome-greeter",
      name: "Welcome / Greeter",
      icon: "wave",
      tagline: "Be the first warm face our guests see as they arrive.",
      summary:
        "First impressions set the tone for the whole day. Greeters meet guests as they step off the buses, welcome them by name where possible, and help them feel immediately at home.",
      whatYoullDo: [
        "Greet guests warmly as buses arrive",
        "Help guests get oriented and point them to check-in",
        "Hold doors, offer directions, and set a loving tone",
        "Keep the entry flowing and friendly",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Outgoing, friendly people who love welcoming others",
      ],
      requirements: [],
      lead: "",
      photos: [
        { src: "images/areas/welcome-greeter-1.jpg", caption: "Welcoming guests as they arrive" },
        { src: "images/areas/welcome-greeter-2.jpg", caption: "Greeters make everyone feel at home" },
      ],
    },
    {
      id: "guest-check-in",
      name: "Guest Check-In",
      icon: "clipboard",
      tagline: "Register guests and send them off with a stocked backpack.",
      summary:
        "Check-in is where each guest officially begins their Blessfest day. The team registers guests, hands out the hygiene backpacks, and points them toward the services they want most.",
      whatYoullDo: [
        "Check guests in at the registration tables",
        "Hand out new backpacks stocked with hygiene items",
        "Orient guests to the meal and available services",
        "Keep lines moving with patience and warmth",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Organized, friendly helpers who stay calm in a busy line",
      ],
      requirements: [],
      lead: "",
      photos: [],
    },
    {
      id: "childrens-ministry",
      name: "Children's Ministry",
      icon: "kids",
      tagline: "Give guest families a safe, joyful space for their kids.",
      summary:
        "Some guests arrive with children. Our children's team provides a safe, fun, supervised space with games and crafts so kids are cared for and parents can rest and receive services.",
      whatYoullDo: [
        "Care for and supervise guests' children",
        "Lead games, crafts, and activities",
        "Keep the space safe, clean, and joyful",
        "Help kids feel loved and celebrated",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Volunteers who love kids and bring great energy",
      ],
      requirements: [
        "A current background check is typically required to serve with children — confirm with the lead",
      ],
      lead: "",
      photos: [],
    },
    {
      id: "dental",
      name: "Dental",
      icon: "tooth",
      tagline: "Free dental care from licensed professionals who give their day.",
      summary:
        "Dental pain is one of the hardest needs to get met on the street. Our dental team offers free care during Blessfest, provided by licensed professionals and their support volunteers.",
      whatYoullDo: [
        "Provide dental services within your scope of practice",
        "Assist licensed providers with intake, setup, and support",
        "Sanitize and turn over stations between guests",
        "Help guests feel comfortable and unhurried",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Licensed dentists, hygienists, and dental assistants",
        "Non-licensed helpers for intake and support",
      ],
      requirements: [
        "Clinical roles require current licensure — confirm credentials with the team lead",
      ],
      lead: "",
      photos: [],
    },
    {
      id: "boutique",
      name: "Boutique",
      icon: "bag",
      tagline: "A curated gift-and-care experience that says 'you're worth it.'",
      summary:
        "The boutique is a special touch — a curated space for personal-care items, make-up, and small gifts where guests are treated like the honored guests they are.",
      whatYoullDo: [
        "Help guests select gifts and personal-care items",
        "Offer make-up application and a little pampering",
        "Keep the boutique stocked, beautiful, and inviting",
        "Make every guest feel valued and celebrated",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Warm, attentive helpers; make-up experience a plus",
      ],
      requirements: [],
      lead: "",
      photos: [],
    },
    {
      id: "craft",
      name: "Craft",
      icon: "craft",
      tagline: "Create something to keep — a moment of fun and connection.",
      summary:
        "The craft area is about presence and joy. Guests make something to take with them, and volunteers get unhurried time to connect over a simple, creative activity.",
      whatYoullDo: [
        "Host a craft or seasonal activity station",
        "Sit with guests and create together",
        "Keep supplies stocked and the space welcoming",
        "Celebrate what each guest makes",
      ],
      commitment: [
        { day: "Shift 1", time: "6:30 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:30 AM – 1:00 PM" },
      ],
      needs: [
        "Creative, relational volunteers who love to connect",
      ],
      requirements: [],
      lead: "",
      photos: [],
    },
    {
      id: "setup-team",
      name: "Setup Team",
      icon: "boxes",
      tagline: "Transform the church into the Blessfest space before guests arrive.",
      summary:
        "Before a single guest steps off the bus, the setup team turns the church into a fully-decorated event space — tables, chairs, stations, signage, and decor. This is hands-on, physical, behind-the-scenes work that makes everything else possible.",
      whatYoullDo: [
        "Set up tables, chairs, and every service station",
        "Hang signage and decorate the space",
        "Move and stage supplies where teams need them",
        "Get every area guest-ready before doors open",
      ],
      commitment: [
        { day: "Mon–Wed before", time: "Setup shifts, Nov 23–25 (times TBD)" },
        { day: "Thanksgiving Day", time: "Early call time (~5:30 AM) for final setup" },
      ],
      needs: [
        "Lots of hands; some able to lift and move tables/chairs",
      ],
      requirements: [
        "Closed-toe shoes recommended; let the lead know about lifting limits",
      ],
      lead: "",
      photos: [],
    },
    {
      id: "tear-down-team",
      name: "Tear Down Team",
      icon: "truck",
      tagline: "Close the day well — reset the space and steward the donations.",
      summary:
        "When the last guest heads home, the tear down team brings everything back to normal — breaking down stations, cleaning up, resetting the facility, and carefully handling leftover donations and supplies.",
      whatYoullDo: [
        "Break down stations, tables, and chairs",
        "Clean and reset the facility for regular use",
        "Sort, box, and store leftover donations and supplies",
        "Load out and finish strong as a team",
      ],
      commitment: [
        { day: "Thanksgiving Day", time: "Afternoon/evening, after the event ends" },
        { day: "Fri after", time: "Possible additional reset shift, Nov 27" },
      ],
      needs: [
        "Energetic helpers who can stay late and lift",
      ],
      requirements: [
        "Closed-toe shoes recommended; let the lead know about lifting limits",
      ],
      lead: "",
      photos: [],
    },
  ],
};
