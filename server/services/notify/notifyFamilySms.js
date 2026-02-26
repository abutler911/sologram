const { sendSmsWithRetry } = require('../sms/textbeltClient');
const recipients = require('../../config/smsRecipients');

const BRAND = 'SoloGram';
const OPTOUT = ' Stop=End';
const QUOTA_THRESHOLD = 15;

async function checkQuota(res) {
  if (
    res?.quotaRemaining !== undefined &&
    res.quotaRemaining <= QUOTA_THRESHOLD
  ) {
    console.warn(`⚠️ LOW QUOTA ALERT: ${res.quotaRemaining} credits left.`);
  }
}

const firstName = (n = '') => String(n).split(' ')[0] || 'friend';
const truncate = (s, n) => {
  const limit = Math.max(0, n);
  return s && s.length > limit ? s.slice(0, limit - 1) + '...' : s;
};

function makeMessage({ kind, title, name, hours }) {
  // URL intentionally omitted — Textbelt blocks outbound URLs.
  // Recipients open the app directly from the notification.
  const baseByKind = {
    post: `${BRAND}: ${firstName(name)}, new post: "${title}"`,
    story: `${BRAND}: new story: "${title}"${hours ? ` (${hours}h)` : ''}`,
    thought: `${BRAND}: new thought: "${truncate(title, 100)}"`,
    default: `${BRAND}: update: "${title}"`,
  };

  let fullMessage = `${baseByKind[kind] || baseByKind.default}${OPTOUT}`;

  // Shrink title if message exceeds 160 chars
  if (fullMessage.length > 160) {
    const overflow = fullMessage.length - 160;
    const targetTitleLen = Math.max(10, (title?.length || 0) - overflow);
    const shortTitle = truncate(title, targetTitleLen);
    const base = (baseByKind[kind] || baseByKind.default).replace(
      `"${title}"`,
      `"${shortTitle}"`
    );
    fullMessage = `${base}${OPTOUT}`;

    // Hard cap just in case
    if (fullMessage.length > 160)
      fullMessage = fullMessage.slice(0, 157) + '...';
  }

  return fullMessage;
}

async function notifyFamilySms(kind, payload) {
  const out = [];
  console.log(`🚀 Starting SMS notifications for kind: ${kind}`);

  for (const r of recipients) {
    const title = payload.title || 'New update';
    const message = makeMessage({
      kind,
      title,
      name: r.name,
      hours: payload?.hours,
    });

    console.log(
      `📤 Sending to ${r.name}: "${message}" (${message.length} chars)`
    );

    try {
      const res = await sendSmsWithRetry(r.phone, message);
      if (out.length === 0) await checkQuota(res);
      out.push({ name: r.name, phone: r.phone, ...res });
      console.log(`✅ SMS result for ${r.name}:`, res);
    } catch (err) {
      console.error(`❌ SMS failure for ${r.name}:`, err.message);
      out.push({
        name: r.name,
        phone: r.phone,
        success: false,
        error: err.message,
      });
    }

    await new Promise((s) => setTimeout(s, 200));
  }

  return out;
}

module.exports = { notifyFamilySms };
