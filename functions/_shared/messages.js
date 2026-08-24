/* The actual copy volunteers receive. Wave 1 fires on signup; wave 2 on
   area assignment (built later). Keep SMS short — one segment where possible. */

import { shiftWindow, shiftLabel, isDayOfShift } from "./shifts.js";

const YEAR = 2026;

/* Families often register loved ones under one shared phone/email, so a single
   contact can receive several people's texts. Lead every SMS with the person's
   full name so it's unmistakable who each message is for. */
export function smsFor({ firstName, lastName }, body) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name ? `${name} — ${body}` : body;
}

/* "the 6:45–10 AM shift" / "the 6:45–10 AM and 9:45 AM–1:15 PM shifts" — from a
   list of shift ids. Empty string if none. */
export function shiftPhrase(shifts) {
  const wins = (shifts || []).map(shiftWindow).filter(Boolean);
  if (!wins.length) return "";
  const joined = wins.length === 1 ? wins[0] : `${wins.slice(0, -1).join(", ")} and ${wins[wins.length - 1]}`;
  return `the ${joined} ${wins.length === 1 ? "shift" : "shifts"}`;
}

export const welcome = {
  sms: (who = {}) => {
    const p = shiftPhrase(who.shifts);
    return smsFor(who,
      `Thanks for signing up to be a part of BlessFest ${YEAR}!` +
      (p ? ` You're down for ${p}.` : "") +
      ` Our administrative team will assign you an area, at which time you'll receive an onboarding text and email. Reply STOP to opt out.`);
  },

  email: ({ firstName, shifts }) => {
    const p = shiftPhrase(shifts);
    return {
    subject: `Thanks for signing up for BlessFest ${YEAR}`,
    text:
      `Hi ${firstName || "there"},\n\n` +
      `Thank you for signing up to be part of BlessFest ${YEAR}!` +
      (p ? ` You're down for ${p}.` : "") +
      ` Our administrative team will assign you to an area of service` +
      `${shifts && shifts.length > 1 ? " for each shift" : ""}. When they do, you'll receive an ` +
      `onboarding text and email with everything you need to know.\n\n` +
      `We're grateful you're joining us.\n\n— The BlessFest Team, Calvary Chapel East Anaheim`,
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">` +
      `<p>Hi ${escapeHtml(firstName) || "there"},</p>` +
      `<p>Thank you for signing up to be part of <b>BlessFest ${YEAR}</b>!` +
      (p ? ` You're down for <b>${escapeHtml(p)}</b>.` : "") +
      ` Our administrative team will assign you to an area of service` +
      `${shifts && shifts.length > 1 ? " for each shift" : ""}. When they do, you'll receive an onboarding ` +
      `text and email with everything you need to know.</p>` +
      `<p>We're grateful you're joining us.</p>` +
      `<p style="color:#6f6960">— The BlessFest Team, Calvary Chapel East Anaheim</p></div>`,
    };
  },
};

/* Wave 2 — fired when an admin assigns the volunteer to an area. Carries the
   tokenized link to their team portal. */
export const onboarding = {
  sms: ({ firstName, lastName, areaName, shift, portalUrl }) => {
    const win = shiftWindow(shift);
    const role = isDayOfShift(shift)
      ? `You're on the ${areaName} team${win ? ` for the ${win} shift` : ""} at BlessFest ${YEAR}! Please arrive a few minutes early.`
      : `You're helping the ${areaName} team with ${shiftLabel(shift)}${win ? ` (${win})` : ""} for BlessFest ${YEAR}!`;
    return smsFor({ firstName, lastName },
      `${role} Here's your team page with details and updates: ${portalUrl} Reply STOP to opt out.`);
  },

  email: ({ firstName, areaName, shift, portalUrl }) => {
    const dayOf = isDayOfShift(shift);
    const win = shiftWindow(shift);
    const label = shiftLabel(shift);
    // Day-of shifts read as a time window ("for the 6:45–10 AM shift"); off-day
    // area help reads as a named task ("with Clothing Sorting (Misc dates)").
    const subjTag = dayOf ? (win ? ` (${win})` : "") : (label ? ` (${label})` : "");
    const assignedTxt = dayOf
      ? `you've been assigned to the ${areaName} team${win ? ` for the ${win} shift` : ""}`
      : `you've been assigned to help the ${areaName} team with ${label}${win ? ` (${win})` : ""}`;
    const assignedHtml = dayOf
      ? `you've been assigned to the <b>${escapeHtml(areaName)}</b> team${win ? ` for the <b>${escapeHtml(win)}</b> shift` : ""}`
      : `you've been assigned to help the <b>${escapeHtml(areaName)}</b> team with <b>${escapeHtml(label)}</b>${win ? ` (${escapeHtml(win)})` : ""}`;
    return {
    subject: `You're on the ${areaName} team${subjTag} for BlessFest ${YEAR}`,
    text:
      `Hi ${firstName || "there"},\n\n` +
      `Great news — ${assignedTxt} for BlessFest ${YEAR}.\n\n` +
      (dayOf && win ? `Your shift runs ${win} — please arrive a few minutes early.\n\n` : "") +
      `Your team page has everything you need: what to expect, your team lead's contact, ` +
      `and important updates including our upcoming team meeting.\n\n` +
      `Open your team page: ${portalUrl}\n\n` +
      `This link is just for you — please don't share it.\n\n— The BlessFest Team, Calvary Chapel East Anaheim`,
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">` +
      `<p>Hi ${escapeHtml(firstName) || "there"},</p>` +
      `<p>Great news — ${assignedHtml} for BlessFest ${YEAR}.</p>` +
      (dayOf && win ? `<p>Your shift runs <b>${escapeHtml(win)}</b> — please arrive a few minutes early.</p>` : "") +
      `<p>Your team page has everything you need: what to expect, your team lead's contact, and ` +
      `important updates including our upcoming team meeting.</p>` +
      `<p><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#d97757;color:#fff;` +
      `font-weight:800;text-decoration:none;padding:12px 22px;border-radius:4px">Open your team page</a></p>` +
      `<p style="font-size:13px;color:#6f6960">This link is just for you — please don't share it.</p>` +
      `<p style="color:#6f6960">— The BlessFest Team, Calvary Chapel East Anaheim</p></div>`,
    };
  },
};

/* Board announcement — emailed to the team every time a leader posts (the SMS
   blast stays opt-in). Carries the person's own portal link. */
export const announcement = {
  email: ({ firstName, areaName, author, body, portalUrl }) => {
    const team = areaName ? `${areaName} team` : "team";
    return {
      subject: areaName
        ? `New update from your BlessFest ${YEAR} ${areaName} team`
        : `A BlessFest ${YEAR} update for your team`,
      text:
        `Hi ${firstName || "there"},\n\n` +
        `${author} just posted an update for the ${team}:\n\n` +
        `  ${body}\n\n` +
        `See this and all your team updates on your team page:\n${portalUrl}\n\n` +
        `— The BlessFest Team, Calvary Chapel East Anaheim`,
      html:
        `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">` +
        `<p>Hi ${escapeHtml(firstName) || "there"},</p>` +
        `<p><b>${escapeHtml(author)}</b> just posted an update for the <b>${escapeHtml(team)}</b>:</p>` +
        `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #d97757;` +
        `background:#faf7f2;white-space:pre-wrap">${escapeHtml(body)}</blockquote>` +
        `<p><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#d97757;color:#fff;` +
        `font-weight:800;text-decoration:none;padding:12px 22px;border-radius:4px">Open your team page</a></p>` +
        `<p style="color:#6f6960">— The BlessFest Team, Calvary Chapel East Anaheim</p></div>`,
    };
  },
};

/* Leader onboarding — sent to area leaders (not volunteers). LEADS with a
   tap-to-activate link so the leader adds their mobile and immediately gets the
   same welcome text their volunteers will receive — a taste of the SMS system.
   Then it covers the admin tools (sign-in is by email code). */
export const leaderWelcome = {
  sms: ({ firstName, lastName, areaLabel, adminUrl }) =>
    smsFor({ firstName, lastName },
      `You're set up as a BlessFest ${YEAR} area leader for ${areaLabel}. Sign in to post announcements and see your team: ${adminUrl} (enter this email to get a code). Reply STOP to opt out.`),

  email: ({ firstName, email, areaLabel, activateUrl, teamUrl }) => ({
    subject: `You're a BlessFest ${YEAR} area leader — activate your team texts`,
    text:
      `Hi ${firstName || "there"},\n\n` +
      `Thank you for leading ${areaLabel} for BlessFest ${YEAR}!\n\n` +
      `FIRST — activate your texts. Tap the link below and enter your mobile number. ` +
      `You'll immediately get your team text, so you know exactly what your volunteers ` +
      `experience:\n   ${activateUrl}\n\n` +
      `Then, your team home is here — post announcements, pin a meeting, and see everyone ` +
      `on your team with their contact info, all in one place:\n   ${teamUrl}\n\n` +
      `To sign in: open that link and enter THIS email address (${email || "your email"}). ` +
      `We'll email you a 6-digit code — type it in and you're in. No password to remember.\n\n` +
      `You'll only ever see your own area. Assignments are handled by the admin team.\n\n` +
      `— The BlessFest Team, Calvary Chapel East Anaheim`,
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">` +
      `<p>Hi ${escapeHtml(firstName) || "there"},</p>` +
      `<p>Thank you for leading <b>${escapeHtml(areaLabel)}</b> for BlessFest ${YEAR}!</p>` +
      `<p><b>First — activate your texts.</b> Enter your mobile number and you'll immediately get ` +
      `your team text, so you know exactly what your volunteers experience.</p>` +
      `<p><a href="${escapeHtml(activateUrl)}" style="display:inline-block;background:#d97757;color:#fff;` +
      `font-weight:800;text-decoration:none;padding:12px 22px;border-radius:4px">Activate your BlessFest texts</a></p>` +
      `<p>Then, <b>your team home</b> is one place to post announcements, pin a meeting, and see ` +
      `everyone on your team with their contact info:</p>` +
      `<p><a href="${escapeHtml(teamUrl)}">${escapeHtml(teamUrl)}</a></p>` +
      `<p>To sign in, open that link and enter <b>this email address</b>. We'll email you a ` +
      `6-digit code — type it in and you're in. No password to remember.</p>` +
      `<p style="font-size:13px;color:#6f6960">You'll only ever see your own area. Assignments are handled by the admin team.</p>` +
      `<p style="color:#6f6960">— The BlessFest Team, Calvary Chapel East Anaheim</p></div>`,
  }),
};

/* Coordinator onboarding — sent to the Volunteer Coordinator (Vickie). She has
   full roster access: place volunteers from the Queue and manage the Directory.
   Also leads with a tap-to-activate link so she can feel the volunteer texts. */
export const coordinatorWelcome = {
  email: ({ firstName, email, activateUrl, queueUrl, directoryUrl }) => ({
    subject: `You're the BlessFest ${YEAR} Volunteer Coordinator — here's your access`,
    text:
      `Hi ${firstName || "there"},\n\n` +
      `Thank you for serving as our Volunteer Coordinator for BlessFest ${YEAR}! ` +
      `You have full access to place and manage volunteers with two tools:\n\n` +
      `1. Assignment Queue — everyone awaiting placement, with their 1st and 2nd ` +
      `area choices. Assign them and they're automatically welcomed to their team.\n   ${queueUrl}\n\n` +
      `2. Directory — search, filter by area, text an individual or a whole group, ` +
      `and export to CSV.\n   ${directoryUrl}\n\n` +
      `To sign in: open either link and enter THIS email address (${email || "your email"}). ` +
      `We'll email you a 6-digit code — type it in and you're in. No password to remember.\n\n` +
      (activateUrl
        ? `Want to see what volunteers get by text? Tap here to activate texts to your ` +
          `own phone and receive the same welcome message they do:\n   ${activateUrl}\n\n`
        : "") +
      `— The BlessFest Team, Calvary Chapel East Anaheim`,
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">` +
      `<p>Hi ${escapeHtml(firstName) || "there"},</p>` +
      `<p>Thank you for serving as our <b>Volunteer Coordinator</b> for BlessFest ${YEAR}! ` +
      `You have full access to place and manage volunteers with two tools:</p>` +
      `<p><b>1. Assignment Queue</b> — everyone awaiting placement, with their 1st and 2nd area choices. ` +
      `Assign them and they're automatically welcomed to their team.<br>` +
      `<a href="${escapeHtml(queueUrl)}">${escapeHtml(queueUrl)}</a></p>` +
      `<p><b>2. Directory</b> — search, filter by area, text an individual or a whole group, and export to CSV.<br>` +
      `<a href="${escapeHtml(directoryUrl)}">${escapeHtml(directoryUrl)}</a></p>` +
      `<p>To sign in, open either link and enter <b>this email address</b>. We'll email you a ` +
      `6-digit code — type it in and you're in. No password to remember.</p>` +
      (activateUrl
        ? `<p>Want to see what volunteers get by text? <a href="${escapeHtml(activateUrl)}">Activate texts to your own phone</a> ` +
          `and receive the same welcome message they do.</p>`
        : "") +
      `<p style="color:#6f6960">— The BlessFest Team, Calvary Chapel East Anaheim</p></div>`,
  }),
};

/* Event Lead onboarding — sent to the overseers (Christian, Ben, Ryan, Jim, Scott).
   They have full access to every backend tool, so this points at the admin
   dashboard rather than a single-area home. Activation link included so they get
   texts too. */
export const eventLeadWelcome = {
  email: ({ firstName, email, activateUrl, adminUrl }) => ({
    subject: `You're a BlessFest ${YEAR} Event Lead — here's your access`,
    text:
      `Hi ${firstName || "there"},\n\n` +
      `Thank you for helping lead BlessFest ${YEAR}! As an Event Lead you oversee the ` +
      `whole event, with full access to every admin tool:\n\n` +
      `- Assignment Queue — place volunteers awaiting an area\n` +
      `- Directory — search, filter, text, and export every volunteer and leader\n` +
      `- Announcements — post to any area's team\n\n` +
      `Your home base is the admin dashboard:\n   ${adminUrl}\n\n` +
      `To sign in: open that link and enter THIS email address (${email || "your email"}). ` +
      `We'll email you a 6-digit code — type it in and you're in. No password to remember.\n\n` +
      (activateUrl
        ? `Activate texts to your own phone (and see exactly what volunteers receive):\n   ${activateUrl}\n\n`
        : "") +
      `— The BlessFest Team, Calvary Chapel East Anaheim`,
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">` +
      `<p>Hi ${escapeHtml(firstName) || "there"},</p>` +
      `<p>Thank you for helping lead <b>BlessFest ${YEAR}</b>! As an <b>Event Lead</b> you oversee ` +
      `the whole event, with full access to every admin tool:</p>` +
      `<ul><li><b>Assignment Queue</b> — place volunteers awaiting an area</li>` +
      `<li><b>Directory</b> — search, filter, text, and export every volunteer and leader</li>` +
      `<li><b>Announcements</b> — post to any area's team</li></ul>` +
      `<p>Your home base is the admin dashboard:<br><a href="${escapeHtml(adminUrl)}">${escapeHtml(adminUrl)}</a></p>` +
      `<p>To sign in, open that link and enter <b>this email address</b>. We'll email you a ` +
      `6-digit code — type it in and you're in. No password to remember.</p>` +
      (activateUrl
        ? `<p><a href="${escapeHtml(activateUrl)}">Activate texts to your own phone</a> and see exactly what volunteers receive.</p>`
        : "") +
      `<p style="color:#6f6960">— The BlessFest Team, Calvary Chapel East Anaheim</p></div>`,
  }),
};

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
