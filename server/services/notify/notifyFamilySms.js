// server/services/notify/notifyFamilySms.js
const { sendSmsWithRetry } = require("../sms/textbeltClient");
const recipients = require("../../config/smsRecipients");

// --- config knobs ---
const EMOJIS_ENABLED = true; // flip to false if you ever want plain text
const BRAND = "SoloGram";
const OPTOUT = " Reply STOP to opt-out."; // keep for compliance
// --------------------

function firstName(name = "") {
  return String(name).split(" ")[0] || "friend";
}

// Truncate while respecting final length budget
function truncate(text, max) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + "…";
}

// Build a short, friendly link suffix (optional)
function linkSuffix(url) {
  if (!url) return "";
  // avoid super long URLs in SMS
  const clean = url.length > 36 ? url.slice(0, 33) + "…" : url;
  return ` ${clean}`;
}

// Random fun templates per kind
function templateFor(kind, withEmoji = true) {
  const sparkle = withEmoji ? "✨" : "";
  const camera = withEmoji ? "📸" : "";
  const bolt = withEmoji ? "⚡" : "";
  const thought = withEmoji ? "💭" : "";
  const fire = withEmoji ? "🔥" : "";
  const bell = withEmoji ? "🔔" : "";

  const postTemps = [
    (name, title, url) =>
      `${bell} ${BRAND} → ${name}, new post: “${title}”.${linkSuffix(url)}`,
    (name, title, url) =>
      `${camera} ${BRAND}: ${name}, don’t miss “${title}”!${linkSuffix(url)}`,
    (name, title, url) =>
      `${sparkle} ${BRAND}: “${title}” just dropped for you, ${name}.${linkSuffix(
        url
      )}`,
    (name, title, url) =>
      `${fire} ${BRAND} post: “${title}”. You’ll like this.${linkSuffix(url)}`,
  ];

  const storyTemps = [
    (name, _t, url) =>
      `${bolt} ${BRAND}: new story for you, ${name}!${linkSuffix(url)}`,
    (name, _t, url) =>
      `${sparkle} ${BRAND}: fresh story—tap quick!${linkSuffix(url)}`,
  ];

  const thoughtTemps = [
    (name, title, url) =>
      `${thought} ${BRAND}: new thought—“${title}”.${linkSuffix(url)}`,
    (name, title, url) =>
      `${bell} ${BRAND}: pondering “${title}”…${linkSuffix(url)}`,
  ];

  if (kind === "post") return postTemps;
  if (kind === "story") return storyTemps;
  if (kind === "thought") return thoughtTemps;
  return [
    (name, title, url) =>
      `${bell} ${BRAND}: update—“${title || "Something new"}”.${linkSuffix(
        url
      )}`,
  ];
}

function buildMessage(kind, payload, recipientName) {
  const name = firstName(recipientName);
  const titleRaw = payload?.title || payload?.text || "New update";
  const url = payload?.url; // optional, pass in from controller if you want

  // Budget math: keep total ≤160 chars
  // Reserve ~35 chars for footer + wiggle room
  const FOOTER = OPTOUT;
  const MAX_TOTAL = 160;
  const MAX_BODY = MAX_TOTAL - FOOTER.length;

  const temps = templateFor(kind, EMOJIS_ENABLED);
  const pick = temps[Math.floor(Math.random() * temps.length)];

  // Title gets truncated dynamically after the template is formed
  // Make a first draft, then adjust if too long:
  let msg = pick(name, titleRaw, url);
  if (msg.length > MAX_BODY) {
    // try shorten the title
    const over = msg.length - MAX_BODY;
    const maxTitle = Math.max(8, titleRaw.length - over - 1);
    const titleShort = truncate(titleRaw, maxTitle);
    msg = pick(name, titleShort, url);
    if (msg.length > MAX_BODY) {
      // last resort: strip URL
      msg = pick(name, titleShort, null);
      if (msg.length > MAX_BODY) {
        // if still long, cut name embellishments
        msg = msg.slice(0, MAX_BODY - 1) + "…";
      }
    }
  }

  // Final compose with footer
  const finalMsg = msg + FOOTER;
  return finalMsg.length <= MAX_TOTAL ? finalMsg : finalMsg.slice(0, MAX_TOTAL);
}

/**
 * Send to the hard-coded family list
 * @param {'post'|'story'|'thought'} kind
 * @param {{title?:string,text?:string,url?:string,postId?:string}} payload
 */
async function notifyFamilySms(kind, payload) {
  const results = [];
  for (const r of recipients) {
    const message = buildMessage(kind, payload, r.name);
    const res = await sendSmsWithRetry(r.phone, message);
    results.push({ name: r.name, phone: r.phone, ...res });
    await new Promise((s) => setTimeout(s, 120)); // mild pacing
  }
  return results;
}

module.exports = { notifyFamilySms };
