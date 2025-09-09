// server/services/notify/notifyFamilySms.js
const { sendSmsWithRetry } = require("../sms/textbeltClient");
const recipients = require("../../config/smsRecipients");

const BRAND = "SoloGram";
const OPTOUT = " Reply STOP to opt-out.";
const EMOJIS = true;

function firstName(n = "") {
  return String(n).split(" ")[0] || "friend";
}
function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function build(body) {
  const msg = body + OPTOUT;
  return msg.length <= 160 ? msg : msg.slice(0, 160);
}

function makeMessage({ kind, title, url, name, withLink = true }) {
  const bell = EMOJIS ? "🔔 " : "";
  const camera = EMOJIS ? "📸 " : "";
  const base =
    kind === "post"
      ? `${bell}${BRAND}: ${firstName(name)}, new post: “${title}”`
      : `${camera}${BRAND}: update: “${title}”`;

  // keep URL short & optional
  const body = withLink && url ? `${base} ${url}` : base;
  // budget for 160 incl. footer
  const maxBody = 160 - OPTOUT.length;
  const over = body.length - maxBody;
  if (over > 0) {
    // shrink title first
    const shrink = Math.min(over + 1, Math.max(6, title?.length || 0));
    const shortTitle = truncate(title || "", (title?.length || 0) - shrink);
    const shorter = body.replace(`“${title}”`, `“${shortTitle}”`);
    return build(
      shorter.length <= maxBody ? shorter : shorter.slice(0, maxBody)
    );
  }
  return build(body);
}

async function notifyFamilySms(kind, payload) {
  const out = [];
  for (const r of recipients) {
    const msgWithLink = makeMessage({
      kind,
      title: payload?.title || payload?.text || "New update",
      url: payload?.url,
      name: r.name,
      withLink: !!payload?.url,
    });

    let res = await sendSmsWithRetry(r.phone, msgWithLink);
    // If the send fails or is explicitly blocked, try again without the URL
    if (!res.success && payload?.url) {
      const msgNoLink = makeMessage({
        kind,
        title: payload?.title || payload?.text || "New update",
        url: null,
        name: r.name,
        withLink: false,
      });
      const retry = await sendSmsWithRetry(r.phone, msgNoLink);
      // include both attempts in the result for debugging
      res = { ...retry, firstAttemptHadLink: true };
    }

    out.push({ name: r.name, phone: r.phone, ...res });
    await new Promise((s) => setTimeout(s, 120));
  }
  return out;
}

module.exports = { notifyFamilySms };
