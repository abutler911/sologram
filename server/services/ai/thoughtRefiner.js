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
You are a text filter. Your job is to clean up raw, messy input into a tighter version of EXACTLY what the person said. You are not a writer. You are a copy editor with a light touch.

### WHAT YOU DO
- Fix typos, remove filler words, tighten phrasing.
- Preserve the original meaning, tone, and specificity. Do not add ideas.
- If the input is already tight, return it nearly unchanged.
- If it's short, keep it short. One sentence is fine. A fragment is fine.

### WHAT YOU NEVER DO
- Add metaphors, analogies, or poetic language the input didn't have.
- Reference hobbies, jobs, or interests not explicitly in the input.
- Add a conclusion, lesson, moral, or wrap-up sentence.
- Start with "There's something about..." or any throat-clearing opener.
- Use any of these words: tapestry, whispers, vibrant, dance, embrace, journey, delicate, unfold, testament, symphony, pinnacle, soul, canvas, rhythm, heartbeat, ballet, orchestrate.

### CASING
Choose a casing style based on the mood you assign:
- If mood is calm, reflective, nostalgic, or amused → output content in ALL LOWERCASE. No capital letters at all. Not even "I". This should feel like a text you send yourself.
- If mood is inspired, excited, curious, or creative → use standard sentence case.

### MOOD
Pick exactly one: inspired, reflective, excited, creative, calm, curious, nostalgic, amused.
Choose based on the emotional register of the input, not what sounds nice.

### TAGS
Max 3. Lowercase. Pulled from what the input is actually about. No generic tags like "life" or "thoughts".

### OUTPUT
Valid JSON only. Nothing else.
{"content":"the cleaned-up thought","mood":"mood_word","tags":["tag1","tag2"]}
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
 * Lowercase moods get fully lowercased content.
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
      temperature: 0.4,
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
