const { sendSmsWithRetry } = require("../sms/textbeltClient");
const recipients = require("../../config/smsRecipients");

// Compliance basics: include your name in the message, and for recurring msgs
// add "Reply STOP to opt-out." (Textbelt auto-handles STOP, but include copy.)
function buildMessage(kind, payload) {
  const brand = "SoloGram";
  const optout = " Reply STOP to opt-out.";
  switch (kind) {
    case "post":
      return `${brand}: New post — ${payload.title}.${optout}`;
    case "story":
      return `${brand}: New story just dropped.${optout}`;
    case "thought": {
      const t = payload.title || (payload.text || "").slice(0, 40);
      return `${brand}: New thought — ${t}.${optout}`;
    }
    default:
      return `${brand}: Update.${optout}`;
  }
}

/**
 * Send to the hard-coded family list
 * @param {'post'|'story'|'thought'} kind
 * @param {{title?:string,text?:string}} payload
 */
async function notifyFamilySms(kind, payload) {
  const message = buildMessage(kind, payload);
  const results = [];
  for (const r of recipients) {
    const res = await sendSmsWithRetry(r.phone, message);
    results.push({ name: r.name, phone: r.phone, ...res });
    await new Promise((r) => setTimeout(r, 120)); // tiny jitter for rate limits
  }
  return results;
}

module.exports = { notifyFamilySms };
