// services/notify/notifyFamilySms.js
const { sendSmsWithRetry } = require('../sms/textbeltClient');
const allRecipients = require('../../config/smsRecipients');

const BRAND = 'SoloGram';
const OPTOUT = ' - Stop=End';
const QUOTA_THRESHOLD = 15;

// ── Recipient filtering ───────────────────────────────────────────────────────
// SMS_NOTIFY_GROUPS controls who gets texts.
//   "dev"         → only recipients tagged group:'dev'
//   "dev,family"  → both groups
//   unset/empty   → all recipients (no filtering)
function getActiveRecipients() {
  const raw = (process.env.SMS_NOTIFY_GROUPS || '').trim();
  if (!raw) return allRecipients; // no filter = everyone

  const groups = new Set(raw.split(',').map((g) => g.trim().toLowerCase()));
  return allRecipients.filter((r) => groups.has((r.group || '').toLowerCase()));
}

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
      const snippet = excerpt(content || title, 90);
      body = snippet
        ? `${fn}, Andrew posted a new thought on SoloGram: "${snippet}"`
        : `${fn}, Andrew posted a new thought on SoloGram`;
      break;
    }
    case 'post': {
      body = `${fn}, Andrew posted a new photo/post on SoloGram: "${truncate(title, 60)}"`;
      break;
    }
    case 'story': {
      const hoursNote = hours ? ` Only up for ${hours}h!` : '';
      body = `${fn}, Andrew shared a new story on SoloGram: "${truncate(title, 60)}".${hoursNote}`;
      break;
    }
    default: {
      body = `${fn}, something new from Andrew on SoloGram: "${truncate(title || content, 70)}".`;
    }
  }

  let fullMessage = `${body}${OPTOUT}`;

  if (fullMessage.length > 160) {
    fullMessage = `${truncate(body, 160 - OPTOUT.length)}${OPTOUT}`;
  }

  return fullMessage;
}

async function notifyFamilySms(kind, payload) {
  const recipients = getActiveRecipients();
  const out = [];

  console.log(
    `🚀 SMS notify [${kind}] → ${recipients.length} recipient(s): ${recipients.map((r) => r.name).join(', ') || '(none)'}`
  );

  if (recipients.length === 0) return out;

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
