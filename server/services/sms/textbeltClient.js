const axios = require("axios");

const BASE = process.env.TEXTBELT_BASE_URL || "https://textbelt.com";
const RAWKEY = process.env.TEXTBELT_KEY || "";
const KEY = process.env.TEXTBELT_TEST === "true" ? `${RAWKEY}_test` : RAWKEY;
const ENABLED = process.env.TEXTBELT_ENABLED === "true";
const SENDER = process.env.TEXTBELT_SENDER || undefined;

function isTransient(err) {
  const code = err?.response?.status;
  return code === 429 || code >= 500;
}

/**
 * Send one SMS via Textbelt.
 * @param {string} phone US 10-digit or E.164 for intl
 * @param {string} message keep ~160 chars
 * @returns {Promise<{success:boolean, quotaRemaining?:number, textId?:string, error?:string, transient?:boolean}>}
 */
async function sendSms(phone, message) {
  if (!ENABLED || !KEY) return { success: false, error: "SMS disabled" };

  const body = new URLSearchParams({ phone, message, key: KEY });
  if (SENDER) body.append("sender", SENDER); // optional, regulatory only

  try {
    const res = await axios.post(`${BASE}/text`, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10_000,
    });
    return res.data; // { success, quotaRemaining, textId, error? }
  } catch (err) {
    return {
      success: false,
      error: err.message || "send failed",
      transient: isTransient(err),
    };
  }
}

/** Backoff on 429/5xx, up to 3 tries */
async function sendSmsWithRetry(phone, message, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    const out = await sendSms(phone, message);
    if (out.success || !out.transient) return out;
    await new Promise((r) => setTimeout(r, 500 * 2 ** i)); // 0.5s,1s,2s
    last = out;
  }
  return last || { success: false, error: "unknown failure" };
}

module.exports = { sendSmsWithRetry };
