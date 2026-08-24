/* Server-side area id -> display name. Mirrors the areas in public/data.js
   (the public source of truth); kept here so server code — leader onboarding,
   scoped roster views — can name an area without loading the client bundle.
   If you rename an area in data.js, update it here too. */

export const AREA_NAMES = {
  hair: "Hair",
  nails: "Nails",
  clothing: "Clothing",
  boutique: "Boutique",
  craft: "Craft",
  "food-prep": "Kitchen",
  "food-service": "Food Service",
  "dining-room": "Dining Room Hosts",
  janitorial: "Janitorial",
  "prayer-evangelism": "Prayer / Evangelism",
  photobooth: "Photobooth",
  "transportation-team": "Transportation Team",
  "welcome-greeter": "Welcome / Greeter",
  "guest-check-in": "Guest Check-In",
  "childrens-ministry": "Children's Ministry",
  dental: "Dental",
  optometry: "Optometry",
  "legal-services": "Legal Services",
  "setup-team": "Setup Team",
  "tear-down-team": "Tear Down Team",
  "first-response": "First Response",
  "emergency-response": "Emergency Response",
  "volunteer-check-in": "Volunteer Check-In",
};

export const areaName = (id) => AREA_NAMES[id] || id;
