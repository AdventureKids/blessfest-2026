/* ============================================================
   BLESSFEST 2026 — CONTENT
   This is the only file you need to edit to change copy, links,
   times, and area details. The site builds itself from this.

   >>> THINGS TO CONFIRM / UPDATE (I drafted these — verify them):
     - config.eventDate / time  (set to Thanksgiving Day 2026)
     - config.registerUrl / shirtUrl  (still point at the 2025 forms)
     - Most areas now run two shifts: 6:45 AM–10:00 AM and
       9:45 AM–1:15 PM. Setup and Tear Down keep their own schedules.
     - area.lead is left blank on purpose (used by the future
       signed-up-volunteer version).
   ============================================================ */

window.BLESSFEST = {
  config: {
    year: 2026,
    eventDate: "Thursday, November 26, 2026",   // Thanksgiving Day — confirm
    eventDateShort: "Thanksgiving Day · Nov 26",
    time: "Two shifts · 6:45 AM–10 AM and 9:45 AM–1:15 PM",
    location: "Calvary Chapel East Anaheim",
    address: "5605 E La Palma Ave, Anaheim, CA",

    registerUrl: "https://ccea.formstack.com/forms/blessfest2026",   // 2026 Formstack form
    // The form URL sends no X-Frame-Options / frame-ancestors, so it embeds
    // cleanly. true = "Volunteer" opens it in an on-page popup (iframe); false =
    // opens in a new tab.
    embedForm:   true,
    donateUrl:   "https://ppay.co/_uyMYt3CP5A",
    shirtUrl:    "https://ccea.formstack.com/forms/blessfest_shirts_2026",
    galleryUrl:  "https://calvarychapeleastanaheim.pixieset.com/blessfest2024/",
    homeUrl:     "https://cc-ea.org/",

    // Countdown target (event start, first shift). Pacific = UTC-8 in November.
    eventStart:  "2026-11-26T06:45:00-08:00",
    // Promo video. Either self-host a file (videoFile: "videos/blessfest.mp4",
    // must be < 25 MB for Cloudflare Pages) OR embed a hosted one (videoUrl:
    // YouTube "https://www.youtube.com/embed/ID" / Vimeo player URL). videoFile
    // wins if both are set. Both empty = the video section is hidden.
    videoFile:   "",
    videoUrl:    "https://www.youtube.com/embed/syX7TiKA3k4",
    // Live-counter goals shown on the homepage.
    volunteerGoal: 800,
    guestGoal:     800,
  },

  /* Event staff / leadership shown on the /#/team page. Drop a headshot at
     public/images/staff/<id>.jpg; until then a monogram shows. ROLE TEXT IS
     DRAFTED — edit freely. */
  staff: [
    { id: "ryan",      name: "Ryan Young",          role: "BlessFest Director",    email: "ryan.young@cc-ea.org",
      bio: "Leads the vision and coordination of BlessFest across every team." },
    { id: "bob",       name: "Pastor Bob Kopeny",   role: "Senior Pastor",         email: "Bob.Kopeny@cc-ea.org",
      bio: "Senior Pastor of Calvary Chapel East Anaheim." },
    { id: "christian", name: "Christian Kopeny",    role: "Event Lead",            email: "christian.kopeny@cc-ea.org",
      bio: "Supports the leaders in various areas leading up to and on the day of the event." },
    { id: "ben",       name: "Ben Goodner",         role: "Event Lead",            email: "ben.goodner@cc-ea.org",
      bio: "Supports the leaders in various areas leading up to and on the day of the event." },
    { id: "jim",       name: "Pastor Jim Richards", role: "Event Lead",            email: "Jim.Richards@cc-ea.org",
      bio: "Supports the leaders in various areas leading up to and on the day of the event." },
    { id: "vickie",    name: "Vickie Wright",       role: "Volunteer Coordinator", email: "Vickie.Wright@cc-ea.org",
      bio: "Places every volunteer and keeps each team staffed and informed." },
    { id: "scott",     name: "Scott Wiedensohler",  role: "Event Lead",            email: "Scott.Wiedensohler@cc-ea.org",
      bio: "Supports the leaders in various areas leading up to and on the day of the event." },
  ],

  mission: {
    heroLine1: "A seat at the table",
    heroLine2: "for our neighbors.",
    heroSub:
      "BlessFest is our Thanksgiving Day outreach to neighbors experiencing homelessness. We bus guests in from partner shelters, share a full Thanksgiving meal together, and offer free services — all to meet real needs and point to the One who meets every need: Jesus.",
    verseRef: "Romans 12:10 (NIV)",
    verse: "Be devoted to one another in love. Honor one another above yourselves.",
    body:
      "Each Thanksgiving we open the doors of the church to hundreds of guests. Our goal is to meet as many physical needs as possible while caring for the whole person. Every guest can enjoy a complete Thanksgiving meal and free services, and leaves with a hygiene kit of toiletries and scripture reminders. Volunteers don't just serve — we sit down and eat together, because everyone deserves to share a table with people who love them.",
    closingVerseRef: "Matthew 25:40",
    closingVerse:
      "Truly, I say to you, as you did it to one of the least of these my brothers, you did it to me.",
  },

  highlights: [
    { label: "Free Thanksgiving meal", detail: "A full, sit-down meal shared together." },
    { label: "Transportation provided", detail: "Guests bused to and from partner shelters." },
    { label: "Free services", detail: "Haircuts, dental, clothing, prayer, and more." },
    { label: "Hygiene kits", detail: "Each guest leaves with stocked hygiene essentials." },
  ],

  needs: {
    hygieneTitle: "Hygiene kit items",
    hygieneNote: "Completed kits or bulk items both welcome. Travel-size preferred.",
    hygiene: ["Toothbrush", "Toothpaste", "Floss", "Deodorant", "Comb / brush", "Hand sanitizer", "Travel soap & shampoo", "Chapstick", "Snack (granola bar, dried fruit, crackers)"],
    clothingTitle: "Cold-weather clothing",
    clothingNote: "New or gently used unless noted. No t-shirts, blouses, or tops this year.",
    clothing: [
      { item: "Blankets", note: "New or lightly used · we ran out the last two years" },
      { item: "Jackets", note: "New or lightly used · men's & women's" },
      { item: "Pants", note: "New or lightly used · no shorts · men's & women's" },
      { item: "Shoes", note: "New or lightly used · no sandals" },
      { item: "Underwear", note: "Brand new only · men's M, women's S/M" },
      { item: "Socks", note: "Brand new only · no children's" },
    ],
  },

  faq: [
    { q: "Are all those experiencing homelessness in Orange County invited?",
      a: "No — this year we're partnering with a few local shelters and busing guests in from there." },
    { q: "Do volunteers eat with the guests?",
      a: "Yes. Please come ready to eat. We want our guests to experience a Thanksgiving meal with people who love them — let's break bread together." },
    { q: "What should I bring to volunteer?",
      a: "Your BlessFest shirt and a good attitude. Wearing your shirt is encouraged but not required." },
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [
        "Licensed nail techs and experienced volunteers",
        "Helpers to host and keep things moving",
      ],
      requirements: [
        "No license required — just a friendly, steady hand",
      ],
      lead: "",
      photos: [
        { src: "images/areas/nails/nails-1.jpg", caption: "A manicure — and plenty of laughter" },
        { src: "images/areas/nails/nails-2.jpg", caption: "Careful, personal attention for every guest" },
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
      name: "Kitchen",
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
        { src: "images/areas/food-service/food-service-1.jpg", caption: "The crew keeping every table fed" },
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [
        "Mature believers comfortable praying with and listening to guests",
      ],
      requirements: [
        "A heart to serve and listen first — training/guidance provided by the lead",
      ],
      lead: "",
      photos: [
        { src: "images/areas/prayer-evangelism/prayer-1.jpg", caption: "Comfort, presence, and prayer" },
        { src: "images/areas/prayer-evangelism/prayer-2.jpg", caption: "Time to stop and pray, one-on-one" },
        { src: "images/areas/prayer-evangelism/prayer-3.jpg", caption: "Lifting up every request together" },
      ],
    },
    {
      id: "photobooth",
      name: "Photobooth",
      icon: "camera",
      tagline: "Capture the joy — send every guest home with a keepsake photo.",
      summary:
        "The photobooth is pure fun. Guests strike a pose — solo, with friends, or with the family they came with — and walk away with a printed photo to remember the day. Volunteers keep the smiles coming and help everyone feel like a star.",
      whatYoullDo: [
        "Welcome guests to the booth and help them pose",
        "Run the camera and printer, handing out photos on the spot",
        "Offer fun props and keep the energy light and joyful",
        "Make sure every guest who wants a photo gets one",
      ],
      commitment: [
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [
        "Upbeat, friendly volunteers who love making people smile",
      ],
      requirements: [],
      lead: "",
      photos: [],
    },
    {
      id: "transportation-team",
      name: "Transportation Team",
      icon: "bus",
      tagline: "Ride along with our guests — the first friendly faces of the day.",
      summary:
        "The transportation team rides the buses with our guests to and from the partner shelters. You welcome each guest aboard, hand out their admission wristbands, and help everyone feel cared for from the very first mile — setting the tone before they even arrive.",
      whatYoullDo: [
        "Ride the bus with guests between the shelters and the church",
        "Welcome each guest warmly as they board",
        "Hand out admission wristbands and answer questions",
        "Help guests on and off the bus and keep the ride smooth and safe",
      ],
      commitment: [
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [
        "Warm, dependable volunteers comfortable riding along and helping guests",
      ],
      requirements: [],
      lead: "",
      photos: [],
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [
        "Outgoing, friendly people who love welcoming others",
      ],
      requirements: [],
      lead: "",
      photos: [
        { src: "images/areas/welcome-greeter/welcome-greeter-1.jpg", caption: "Welcoming guests as they arrive" },
        { src: "images/areas/welcome-greeter/welcome-greeter-2.jpg", caption: "Greeters make everyone feel at home" },
      ],
    },
    {
      id: "guest-check-in",
      name: "Guest Check-In",
      icon: "clipboard",
      tagline: "Register guests and send them off with a hygiene kit.",
      summary:
        "Check-in is where each guest officially begins their BlessFest day. The team registers guests, hands out hygiene kits, and points them toward the services they want most.",
      whatYoullDo: [
        "Check guests in at the registration tables",
        "Hand out hygiene kits to each guest",
        "Orient guests to the meal and available services",
        "Keep lines moving with patience and warmth",
      ],
      commitment: [
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
        "Dental pain is one of the hardest needs to get met on the street. Our dental team offers free care during BlessFest, provided by licensed professionals and their support volunteers.",
      whatYoullDo: [
        "Provide dental services within your scope of practice",
        "Assist licensed providers with intake, setup, and support",
        "Sanitize and turn over stations between guests",
        "Help guests feel comfortable and unhurried",
      ],
      commitment: [
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
      /* Partner-staffed: `staffedBy` makes this an informational page, not a
         recruiting one — no "What you'll do", no "Who's needed", no Volunteer
         button. See CLAUDE.md. COPY IS DRAFTED, NOT CONFIRMED. */
      id: "optometry",
      name: "Optometry",
      icon: "eye",
      tagline: "Free eye exams and glasses, provided by our partners at Ketchum.",
      summary:
        "Clear vision is easy to take for granted until it's gone. Our optometry team offers free eye exams during BlessFest so guests can read, work, and see the faces around them clearly again.",
      staffedBy: "Marshall B. Ketchum University",
      staffedNote:
        "Optometry at BlessFest is run by doctors and student clinicians from Marshall B. Ketchum University, who bring their own team. Because this area comes fully staffed, we aren't taking volunteer sign-ups for it — but every other area still needs hands.",
      whatYoullDo: [],
      commitment: [
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [],
      requirements: [],
      lead: "",
      photos: [],
    },
    {
      /* COPY IS DRAFTED, NOT CONFIRMED — team lead to refine. */
      id: "legal-services",
      name: "Legal Services",
      icon: "scales",
      tagline: "Free legal guidance from attorneys who give their morning.",
      summary:
        "A single unanswered legal question — an old warrant, an eviction notice, a custody worry — can keep someone stuck for years. Our legal team offers free, confidential guidance during BlessFest, provided by licensed attorneys and their support volunteers.",
      whatYoullDo: [
        "Offer brief legal guidance to guests within your area of practice",
        "Help guests understand their options and next steps",
        "Assist attorneys with intake, paperwork, and support",
        "Keep every conversation private, calm, and unhurried",
      ],
      commitment: [
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [
        "Licensed attorneys across practice areas",
        "Non-licensed helpers for intake and support",
      ],
      requirements: [
        "Giving legal advice requires active bar membership in good standing — confirm with the team lead",
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
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
      tagline: "Transform the church into the BlessFest space before guests arrive.",
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
    {
      /* COPY IS DRAFTED, NOT CONFIRMED — team lead to refine. */
      id: "first-response",
      name: "First Response",
      icon: "shield",
      tagline: "A calm, watchful presence that keeps everyone safe.",
      summary:
        "First Response is our safety and security team — steady, level-headed volunteers who keep watch over the event so guests, volunteers, and staff can focus on the day. You'll be a reassuring presence at entrances and across the grounds, ready to help, guide, and calmly handle whatever comes up.",
      whatYoullDo: [
        "Keep a friendly, watchful eye on entrances and the grounds",
        "Help guests and volunteers find their way and feel welcome",
        "Keep walkways and exits clear and orderly",
        "Calmly de-escalate and radio for help when needed",
      ],
      commitment: [
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [
        "Calm, alert volunteers comfortable being a steady presence",
        "A background in security, law enforcement, or the military is a plus (not required)",
      ],
      requirements: [
        "Must be 18+, able to stand and walk for your shift, and stay level-headed under pressure",
      ],
      lead: "",
      photos: [],
    },
    {
      /* Internal, invite-only — filtered off the public site (see `internal` in
         index.html). Kept here so it's assignable and has a name/leader in the backend. */
      id: "emergency-response",
      name: "Emergency Response",
      icon: "aid",
      internal: true,
      tagline: "Trained medical and emergency response for the day.",
      summary:
        "Emergency Response is our trained medical and emergency team, filled by invitation.",
      whatYoullDo: [],
      commitment: [
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [],
      requirements: [],
      lead: "",
      photos: [],
    },
    {
      /* Internal, invite-only — handpicked volunteers, no public page. */
      id: "volunteer-check-in",
      name: "Volunteer Check-In",
      icon: "clipboard",
      internal: true,
      tagline: "Check volunteers in and point them to their teams.",
      summary:
        "Volunteer Check-In is a handpicked team that greets volunteers as they arrive, checks them in, and gets them to the right area.",
      whatYoullDo: [],
      commitment: [
        { day: "Shift 1", time: "6:45 AM – 10:00 AM" },
        { day: "Shift 2", time: "9:45 AM – 1:15 PM" },
      ],
      needs: [],
      requirements: [],
      lead: "",
      photos: [],
    },
  ],
};
