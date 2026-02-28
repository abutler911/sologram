// services/thoughts/createAndNotify.js
// Single source of truth for creating a thought and fanning out notifications.
// Called by both the web controller (createThought) and the quick thought route.

const Thought = require('../../models/Thought');
const User = require('../../models/User');
const { sendEmail } = require('../../utils/sendEmail');
const {
  buildThoughtEmail,
} = require('../../utils/emailTemplates/thoughtPostedTemplate');
const { notifyFamilySms } = require('../notify/notifyFamilySms');
const { logger } = require('../../utils/logger');

const EMOJIS = ['💭', '🧠', '🔥', '🤔', '✨'];
const randomEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

/**
 * Create a thought in the DB and fire off email + SMS notifications.
 *
 * @param {Object} data
 * @param {string} data.content   - The thought text (required)
 * @param {string} [data.mood]    - One of the Thought schema moods
 * @param {string[]} [data.tags]  - Array of tag strings
 * @param {Object} [data.media]   - { mediaType, mediaUrl, cloudinaryId }
 * @param {string} [data.source]  - "web" | "shortcut" (for logging)
 * @returns {Promise<Object>} The created Thought document
 */
async function createAndNotify(data) {
  const { content, mood = 'creative', tags = [], media, source = 'web' } = data;

  const thoughtData = { content, mood, tags };
  if (media) thoughtData.media = media;

  const thought = await Thought.create(thoughtData);

  const base = process.env.APP_PUBLIC_URL || 'https://thesologram.com';
  const thoughtUrl = `${base}/thought/${thought._id}`;

  logger.info(`[createAndNotify] Thought created via ${source}`, {
    context: { thoughtId: thought._id.toString(), source },
  });

  // ── SMS fan-out (fire-and-forget) ───────────────────────────────────────
  notifyFamilySms('thought', { content: thought.content, url: thoughtUrl })
    .then((out) =>
      console.table(
        out.map(({ name, phone, success, textId, error }) => ({
          name,
          phone,
          success,
          textId,
          error,
        }))
      )
    )
    .catch((e) => console.error('[SMS notify error]', e?.message || e));

  // ── Email fan-out (fire-and-forget) ─────────────────────────────────────
  User.find({})
    .then(async (users) => {
      for (const user of users) {
        await sendEmail({
          to: user.email,
          subject: `[SoloGram] Andy shared a new thought ${randomEmoji()}`,
          html: buildThoughtEmail({
            content: thought.content,
            thoughtId: thought._id.toString(),
          }),
        });
      }
    })
    .catch((e) => console.error('[Email notify error]', e?.message || e));

  return thought;
}

module.exports = { createAndNotify };
