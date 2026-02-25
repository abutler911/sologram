const { sendSmsWithRetry } = require('../sms/textbeltClient');
const recipients = require('../../config/smsRecipients');

const BRAND = 'SoloGram';
const OPTOUT = ' Stop=End'; // Shorter opt-out to save characters
const QUOTA_THRESHOLD = 15; // Alert you when credits are low

// Helper to check quota and alert you specifically
async function checkQuota(res) {
  if (
    res.quotaRemaining !== undefined &&
    res.quotaRemaining <= QUOTA_THRESHOLD
  ) {
    console.warn(`⚠️ LOW QUOTA ALERT: ${res.quotaRemaining} credits left.`);
    // You could also trigger a specific SMS to yourself here if you wanted
  }
}

const firstName = (n = '') => String(n).split(' ')[0] || 'friend';
const truncate = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '...' : s);

function makeMessage({ kind, title, url, name, hours }) {
  // Removed emojis to keep messages in 160-char GSM-7 encoding
  const baseByKind = {
    post: `${BRAND}: ${firstName(name)}, new post: "${title}"`,
    story: `${BRAND}: new story: "${title}"${hours ? ` (${hours}h)` : ''}`,
    thought: `${BRAND}: new thought: "${truncate(title, 100)}"`,
    default: `${BRAND}: update: "${title}"`,
  };

  const base = baseByKind[kind] || baseByKind.default;
  const link = url ? ` ${url}` : '';

  // Combine and ensure we stay under the 160 limit to avoid multi-credit charges
  let fullMessage = `${base}${link}${OPTOUT}`;

  if (fullMessage.length > 160) {
    const overflow = fullMessage.length - 160;
    const shortenedTitle = truncate(title, title.length - overflow);
    fullMessage = `${base.replace(title, shortenedTitle)}${link}${OPTOUT}`;
  }

  return fullMessage;
}

async function notifyFamilySms(kind, payload) {
  const out = [];
  for (const r of recipients) {
    const title = payload.title || 'New update';
    const message = makeMessage({
      kind,
      title,
      url: payload?.url,
      name: r.name,
      hours: payload?.hours,
    });

    let res = await sendSmsWithRetry(r.phone, message);

    // Check quota on the first recipient's response
    if (out.length === 0) await checkQuota(res);

    out.push({ name: r.name, phone: r.phone, ...res });

    // Slight delay to prevent hitting rate limits
    await new Promise((s) => setTimeout(s, 150));
  }
  return out;
}

module.exports = { notifyFamilySms };
