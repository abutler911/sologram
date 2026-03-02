// services/ai/thoughtRefiner.js
// Accepts raw text, sends to GPT for polish, returns { content, mood, tags }.
// Validates output against Thought schema constraints before returning.

const OpenAI = require('openai');
const { logger } = require('../../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Must match Thought model enum exactly ─────────────────────────────────────
const VALID_MOODS = [
  'inspired',
  'reflective',
  'excited',
  'creative',
  'calm',
  'curious',
  'nostalgic',
  'amused',
];
const DEFAULT_MOOD = 'reflective';
const MAX_CONTENT_LENGTH = 800;

// Quieter moods → all lowercase. Forward-momentum moods → standard case.
const LOWERCASE_MOODS = new Set(['calm', 'reflective', 'nostalgic', 'amused']);

const REFINE_PROMPT = `
You are a thought sharpener. Someone sends you a raw, unpolished thought — maybe thumbed out on a phone, maybe rambling, maybe half-formed. Your job is to find the core of what they're saying and make it hit harder.

### WHAT YOU DO
- Cut filler, tighten phrasing, fix typos.
- Restructure if it helps the thought land better. You can rearrange sentences, combine ideas, cut redundancy.
- Sharpen vague language into something specific. If they said "it was cool," find the sharper version that's still in their voice.
- If there's a stronger ending buried in the middle, move it to the end.
- Short input should stay short. Don't pad. A single punchy sentence is perfect.
- If the raw input is already good, just clean it up and send it back.

### WHAT YOU NEVER DO
- Add ideas, references, or topics that aren't in the input.
- Add metaphors or poetic language the person didn't use.
- Add a conclusion, moral, lesson, or wrap-up.
- Start with "There's something about..." or any generic opener.
- Make it sound like a LinkedIn post, a motivational quote, or a blog.
- Use these words: tapestry, whispers, vibrant, dance, embrace, journey, delicate, unfold, testament, symphony, pinnacle, soul, canvas, rhythm, heartbeat, ballet, orchestrate, resonate, navigate.

### CASING
Choose casing based on the mood you assign:
- calm, reflective, nostalgic, amused → ALL LOWERCASE. no capitals at all. not even "i". like a late-night text to yourself.
- inspired, excited, curious, creative → Standard sentence case.

### MOOD
Pick exactly one: inspired, reflective, excited, creative, calm, curious, nostalgic, amused.
Match the emotional register of the input. Don't upgrade mild feelings into dramatic ones.

### TAGS
Max 3. Lowercase. Specific to what the input is actually about. Never use generic tags like "life", "thoughts", "mood", "reflection".

### OUTPUT
Valid JSON only. Nothing else.
{"content":"the sharpened thought","mood":"mood_word","tags":["tag1","tag2"]}
`.trim();

/**
 * Validate mood against schema enum.
 */
function validMood(raw) {
  if (!raw) return DEFAULT_MOOD;
  const normalised = raw.toLowerCase().trim();
  return VALID_MOODS.includes(normalised) ? normalised : DEFAULT_MOOD;
}

/**
 * Apply casing rules based on mood.
 */
function applyCasing(content, mood) {
  return LOWERCASE_MOODS.has(mood) ? content.toLowerCase() : content;
}

async function refineThought(rawText) {
  const start = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: REFINE_PROMPT },
        { role: 'user', content: rawText },
      ],
      temperature: 0.6,
      max_tokens: 400,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    // ── Validate against Thought schema constraints ───────────────────────
    let content = parsed.content || rawText;
    if (content.length > MAX_CONTENT_LENGTH) {
      const truncated = content.slice(0, MAX_CONTENT_LENGTH);
      const lastPeriod = truncated.lastIndexOf('.');
      content =
        lastPeriod > MAX_CONTENT_LENGTH * 0.5
          ? truncated.slice(0, lastPeriod + 1)
          : truncated;
    }

    const mood = validMood(parsed.mood);
    content = applyCasing(content, mood);

    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map((t) => String(t).toLowerCase().trim()).slice(0, 3)
      : [];

    logger.info('[thoughtRefiner] Refined successfully', {
      context: {
        elapsed: Date.now() - start,
        tokens: completion.usage?.total_tokens,
        contentLength: content.length,
        moodRaw: parsed.mood,
        moodResolved: mood,
        casing: LOWERCASE_MOODS.has(mood) ? 'lowercase' : 'standard',
      },
    });

    return { content, mood, tags };
  } catch (error) {
    logger.error('[thoughtRefiner] Critical Failure', {
      context: { error: error.message, stack: error.stack },
    });
    return {
      content: rawText.slice(0, MAX_CONTENT_LENGTH),
      mood: DEFAULT_MOOD,
      tags: [],
    };
  }
}

module.exports = { refineThought, VALID_MOODS };
