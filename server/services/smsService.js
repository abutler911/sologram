// services/smsService.js
const twilio = require("twilio");

// Initialize Twilio client with null check for development environments
const initTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn(
      "Twilio credentials not found. SMS functionality will be simulated."
    );
    return null;
  }

  return twilio(accountSid, authToken);
};

const client = initTwilioClient();

/**
 * Send SMS message using Twilio
 * @param {string} to - Recipient phone number in E.164 format (e.g., +15551234567)
 * @param {string} body - Message body
 * @returns {Promise} - Twilio message object or mock response
 */
exports.sendSMS = async (to, body) => {
  try {
    // If no Twilio client, simulate sending (for development)
    if (!client) {
      console.log(`[SIMULATED SMS] To: ${to}, Message: ${body}`);
      return {
        sid: "SIMULATED_SID_" + Date.now(),
        to,
        body,
        status: "delivered",
      };
    }

    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log("SMS sent with SID:", message.sid);
    return message;
  } catch (error) {
    console.error("Twilio SMS error:", error);
    throw error;
  }
};

/**
 * Send batch SMS messages (throttled to prevent API limits)
 * @param {Array} subscribers - Array of subscriber objects with phone property
 * @param {string} message - Message to send
 * @returns {Promise<Array>} - Array of results
 */
exports.sendBatchSMS = async (subscribers, message) => {
  const results = [];
  const phoneNumbers = subscribers.map((sub) => sub.phone);

  // Process in batches of 5 with 1 second delay between batches
  // to avoid hitting Twilio rate limits
  for (let i = 0; i < phoneNumbers.length; i += 5) {
    const batch = phoneNumbers.slice(i, i + 5);

    // Send messages in current batch concurrently
    const batchPromises = batch.map((phone) => {
      return this.sendSMS(phone, message)
        .then((result) => ({ phone, success: true, result }))
        .catch((error) => ({ phone, success: false, error }));
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Wait 1 second before processing next batch if not the last batch
    if (i + 5 < phoneNumbers.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
};
