const { sendSmsWithRetry } = require('../sms/textbeltClient');
const recipients = require('../../config/smsRecipients');

const BRAND = 'SoloGram';
const OPTOUT = ' - Stop=End';
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

// Pulls the first sentence or first maxLen chars — whichever is shorter
const excerpt = (text = '', maxLen = 100) => {
  if (!text) return null;
  const clean = text.replace(/\n+/g, ' ').trim();
  const sentenceEnd = clean.search(/[.!?]/);
  if (sentenceEnd > 0 && sentenceEnd <= maxLen)
    return clean.slice(0, sentenceEnd + 1);
  return truncate(clean, maxLen);
};

function makeMessage({ kind, title, content, name, hours }) {
  const fn = firstName(name);
  let body;

  switch (kind) {
    case 'thought': {
      // Thoughts have no title — content IS the message
      const snippet = excerpt(content || title, 110);
      body = snippet
        ? `${fn}, Andrew just shared: "${snippet}"`
        : `${fn}, Andrew just shared a new thought on ${BRAND}.`;
      break;
    }
    case 'post': {
      body = `${fn}, Andrew just posted "${truncate(title, 80)}" on ${BRAND}.`;
      break;
    }
    case 'story': {
      const hoursNote = hours ? ` Gone in ${hours}h.` : '';
      body = `${fn}, Andrew added a story: "${truncate(title, 70)}".${hoursNote}`;
      break;
    }
    default: {
      body = `${fn}, something new from Andrew on ${BRAND}: "${truncate(title || content, 80)}"`;
    }
  }

  let fullMessage = `${body}${OPTOUT}`;

  // Hard cap at 160 chars
  if (fullMessage.length > 160) {
    fullMessage = `${truncate(body, 160 - OPTOUT.length)}${OPTOUT}`;
  }

  return fullMessage;
}

async function notifyFamilySms(kind, payload) {
  const out = [];
  console.log(`🚀 Starting SMS notifications for kind: ${kind}`);

  for (const r of recipients) {
    const message = makeMessage({
      kind,
      title: payload.title || '',
      content: payload.content || payload.title || '',
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
