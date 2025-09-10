const { sendSmsWithRetry } = require("../sms/textbeltClient");
const recipients = require("../../config/smsRecipients");

const BRAND = "SoloGram";
const OPTOUT = " Reply STOP to opt-out.";
const EMOJIS = true;

const E = {
  bell: EMOJIS ? "🔔 " : "",
  camera: EMOJIS ? "📸 " : "",
  book: EMOJIS ? "📖 " : "",
  idea: EMOJIS ? "💡 " : "",
};

const firstName = (n = "") => String(n).split(" ")[0] || "friend";
const truncate = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s);

const build = (body) => {
  const msg = body + OPTOUT;
  return msg.length <= 160 ? msg : msg.slice(0, 160);
};

const resolveTitle = (payload = {}) =>
  payload.title || payload.text || payload.content || "New update";

function makeMessage({ kind, title, url, name, withLink = true, hours }) {
  const baseByKind = {
    post: `${E.bell}${BRAND}: ${firstName(name)}, new post: “${title}”`,
    story: `${E.book}${BRAND}: new story: “${title}”${
      hours ? ` (${hours}h)` : ""
    }`,
    thought: `${E.idea}${BRAND}: new thought: “${truncate(title, 140)}”`,
    default: `${E.camera}${BRAND}: update: “${title}”`,
  };

  const base = baseByKind[kind] || baseByKind.default;

  const body = withLink && url ? `${base} ${url}` : base;
  const maxBody = 160 - OPTOUT.length;
  const over = body.length - maxBody;

  if (over > 0) {
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
    const title = resolveTitle(payload);
    const msgWithLink = makeMessage({
      kind,
      title,
      url: payload?.url,
      name: r.name,
      withLink: !!payload?.url,
      hours: payload?.hours,
    });

    let res = await sendSmsWithRetry(r.phone, msgWithLink);

    if (!res.success && payload?.url) {
      const msgNoLink = makeMessage({
        kind,
        title,
        url: null,
        name: r.name,
        withLink: false,
        hours: payload?.hours,
      });
      const retry = await sendSmsWithRetry(r.phone, msgNoLink);
      res = { ...retry, firstAttemptHadLink: true };
    }

    out.push({ name: r.name, phone: r.phone, ...res });
    await new Promise((s) => setTimeout(s, 120));
  }
  return out;
}

module.exports = { notifyFamilySms };
