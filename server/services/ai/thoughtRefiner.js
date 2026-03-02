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
You are a ghostwriter. Someone texts you a raw, half-formed thought — the kind you thumb out at a red light or mutter to yourself in the shower. Your job is to write the version they would have written if they'd sat with it for ten minutes.

### HOW YOU WRITE
- Rewrite the thought. Don't just clean it up — make it land. Restructure, sharpen, find the better word.
- Keep the MEANING and POINT of the original. Don't drift into a different topic or add new ideas they didn't express.
- Write like a real person, not a writer. No polish for the sake of polish. If the thought is simple, the output should be simple.
- Short is good. One sharp sentence beats three okay ones. Fragments are fine.
- Find the strongest image or idea in the input and build around it. Cut everything else.
- End on the strongest beat. No wrap-ups, no morals, no "and that's okay" energy.

### WHAT YOU NEVER DO
- Add topics, hobbies, references, or context the input doesn't contain.
- Use metaphors or figurative language the person didn't hint at.
- Start with "There's something about..." or any warm-up sentence.
- End with a life lesson, silver lining, or tidy conclusion.
- Sound like a LinkedIn post, a motivational poster, or a therapy session.
- Use these words: tapestry, whispers, vibrant, dance, embrace, journey, delicate, unfold, testament, symphony, pinnacle, soul, canvas, rhythm, heartbeat, ballet, orchestrate, resonate, navigate, profound.

### CASING
Based on the mood you assign:
- calm, reflective, nostalgic, amused → ALL LOWERCASE. no capitals. not even "i". like a text you send yourself at 1am.
- inspired, excited, curious, creative → Standard sentence case.

### MOOD
Exactly one of: inspired, reflective, excited, creative, calm, curious, nostalgic, amused.
Match the emotional register of what they wrote. Don't inflate — if it's mild, pick a mild mood.

### TAGS
Max 3. Lowercase. Specific to the actual subject matter. Never generic ("life", "thoughts", "mood", "vibes").

### OUTPUT
Valid JSON only. Nothing else.
{"content":"the rewritten thought","mood":"mood_word","tags":["tag1","tag2"]}
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
      temperature: 0.7,
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
