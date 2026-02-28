// services/ai/memoirGenerator.js
// Pulls all posts + thoughts from a given month, sends them to OpenAI,
// and returns a first-person memoir entry in Andrew's voice.

const OpenAI = require('openai');
const Post = require('../../models/Post');
const Thought = require('../../models/Thought');
const Memoir = require('../../models/Memoir');
const { logger } = require('../../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MEMOIR_PROMPT = `
You are ghostwriting a monthly memoir entry for Andrew Butler's personal platform, SoloGram.

WHO ANDREW IS:
Andrew Butler. Lives in Herriman, Utah. Delta Air Lines first officer candidate in A220 type rating training. Street and portrait photographer. Beginner pianist. Reads psych thrillers. Quiet, introverted, dry humor. Values fairness and independent thinking.

YOUR JOB:
Write a first-person memoir entry summarizing Andrew's month based on the real posts and thoughts provided below. This is Andrew speaking — use "I" and write in his voice.

VOICE RULES:
- Sound like a real person reflecting on a month of their life, not a content recap.
- Weave the posts and thoughts into a narrative — don't list them.
- Find the threads. If he posted about training AND photography, connect them thematically if there's a natural connection. If not, let them be separate beats.
- Dry humor is welcome. Sentimentality should be earned, not performed.
- No emojis. No inspirational-poster energy. No "what a month it's been!" energy.
- Specific details from the actual posts are better than vague summaries.
- If it was a quiet month with few posts, acknowledge that honestly. Don't inflate.
- Length: 300-600 words. Quality over quantity.

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown fences:
{
  "title": "A short, specific title for this month's entry (not just 'February 2026')",
  "content": "The full memoir entry in first person, as Andrew.",
  "themes": ["theme1", "theme2", "theme3"]
}

Themes should be 2-5 specific words or short phrases that capture the month's threads (e.g., "sim training", "winter light", "piano frustration", "street portraits").
`.trim();

/**
 * Generate a memoir for a specific month/year.
 * @param {number} month - 1-12
 * @param {number} year - e.g. 2026
 * @param {string} trigger - "scheduled" | "manual"
 * @returns {Promise<Object>} The created Memoir document
 */
async function generateMemoir(month, year, trigger = 'scheduled') {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  logger.info(
    `[memoirGenerator] Generating memoir for ${MONTH_NAMES[month]} ${year}`,
    {
      context: { month, year, trigger },
    }
  );

  // Pull the month's content
  const [posts, thoughts] = await Promise.all([
    Post.find({ eventDate: { $gte: start, $lt: end } })
      .sort({ eventDate: 1 })
      .select('title caption content tags eventDate location')
      .lean(),
    Thought.find({ createdAt: { $gte: start, $lt: end } })
      .sort({ createdAt: 1 })
      .select('content mood tags createdAt')
      .lean(),
  ]);

  const postCount = posts.length;
  const thoughtCount = thoughts.length;

  // If nothing was posted, create a minimal entry
  if (postCount === 0 && thoughtCount === 0) {
    const memoir = await Memoir.create({
      title: `${MONTH_NAMES[month]} ${year} — A Quiet Month`,
      content: `Not much to report for ${MONTH_NAMES[month]}. Sometimes the months that leave the least evidence are the ones where the most is happening under the surface. Or sometimes you just don't post. Both are fine.`,
      month,
      year,
      stats: { postCount: 0, thoughtCount: 0 },
      themes: ['quiet'],
      metadata: { trigger, tokens: 0, model: 'none' },
    });
    return memoir;
  }

  // Format content for the prompt
  const postLines = posts.map((p) => {
    const date = new Date(p.eventDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const tags = p.tags?.length ? ` [${p.tags.join(', ')}]` : '';
    const loc = p.location ? ` — ${p.location}` : '';
    const body = p.caption || p.content || '';
    return `POST (${date}${loc})${tags}: "${p.title}" — ${body.slice(0, 300)}`;
  });

  const thoughtLines = thoughts.map((t) => {
    const date = new Date(t.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const mood = t.mood ? ` [${t.mood}]` : '';
    return `THOUGHT (${date})${mood}: ${t.content.slice(0, 300)}`;
  });

  const contentBlock = `
MONTH: ${MONTH_NAMES[month]} ${year}
POSTS THIS MONTH (${postCount}):
${postLines.join('\n') || '(none)'}

THOUGHTS THIS MONTH (${thoughtCount}):
${thoughtLines.join('\n') || '(none)'}
`.trim();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: MEMOIR_PROMPT },
      { role: 'user', content: contentBlock },
    ],
    max_tokens: 1200,
    temperature: 0.75,
  });

  const raw = completion.choices[0].message.content.trim();
  const tokens = completion.usage?.total_tokens || 0;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logger.warn('[memoirGenerator] JSON parse failed, using raw text', {
      context: { raw: raw.slice(0, 200) },
    });
    parsed = {
      title: `${MONTH_NAMES[month]} ${year}`,
      content: raw,
      themes: [],
    };
  }

  const memoir = await Memoir.create({
    title: parsed.title || `${MONTH_NAMES[month]} ${year}`,
    content: parsed.content || raw,
    month,
    year,
    stats: { postCount, thoughtCount },
    themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 6) : [],
    metadata: { trigger, tokens, model: 'gpt-4o-mini' },
  });

  logger.info(`[memoirGenerator] Memoir created: "${memoir.title}"`, {
    context: {
      memoirId: memoir._id.toString(),
      postCount,
      thoughtCount,
      tokens,
    },
  });

  return memoir;
}

module.exports = { generateMemoir, MONTH_NAMES };
