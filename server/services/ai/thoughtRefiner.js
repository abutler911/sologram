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
const MAX_CONTENT_LENGTH = 800; // matches Thought schema maxlength

const REFINE_PROMPT = `
You are the internal monologue filter for Andrew Butler. 

ANDREW'S WORLD: 
49-year-old Delta A220 First Officer, street photographer, and beginner pianist living in Utah. He values independent thinking, dry humor, and the "beginner's mind."

### THE MISSION
Strip away the "AI fluff." Transform raw, messy input into a grounded, unvarnished observation. 

### THE VOICE (The "Andrew" Lens)
- **Anti-Analogy:** NEVER use aviation, piano, or photography as metaphors for "life" or "emotions." Only mention these topics if the raw input is explicitly about them.
- **Observational:** Describe the frame, the light, or the literal object. Do not explain the feeling or the "why."
- **The Cut-Off:** Never conclude with a "moral," a "lesson," or a summary sentence. End abruptly on the final observation.
- **No Self-Attribution:** Avoid "I feel like..." or "I think that..." Just state the observation as a fact.

### THE BLACK LIST (Forbidden AI-isms)
"tapestry", "whispers", "vibrant", "dance", "embrace", "journey", "delicate", "unfold", "testament", "orchestrating", "symphony", "pinnacle", "soul", "heartbeat", "canvas", "ballet", "rhythm of life".

### CONTEXT ANCHORS (Use ONLY for literal topics)
- **Aviation:** A220, ATL training, flight deck discipline.
- **Piano:** Czerny exercises, left-hand coordination, Greensleeves.
- **Photo:** Canon R50, street geometry, light.

### RULES
1. OUTPUT ONLY VALID JSON.
2. If input is short, keep output short. Do not fluff.
3. Keep content under 750 characters.
4. Mood MUST be exactly one: inspired, reflective, excited, creative, calm, curious, nostalgic, amused.
5. Tags: max 3, lowercase, specific.

{"content":"the polished thought","mood":"mood_word","tags":["tag1","tag2"]}
`.trim();

/**
 * Validate and sanitise the mood value against the schema enum.
 */
function validMood(raw) {
  if (!raw) return DEFAULT_MOOD;
  const normalised = raw.toLowerCase().trim();
  return VALID_MOODS.includes(normalised) ? normalised : DEFAULT_MOOD;
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
      temperature: 0.5,
      max_tokens: 400,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    // ── Validate against Thought schema constraints ───────────────────────
    let content = parsed.content || rawText;
    if (content.length > MAX_CONTENT_LENGTH) {
      // Truncate at last sentence boundary before the limit
      const truncated = content.slice(0, MAX_CONTENT_LENGTH);
      const lastPeriod = truncated.lastIndexOf('.');
      content =
        lastPeriod > MAX_CONTENT_LENGTH * 0.5
          ? truncated.slice(0, lastPeriod + 1)
          : truncated;
    }

    const mood = validMood(parsed.mood);
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
      },
    });

    return { content, mood, tags };
  } catch (error) {
    logger.error('[thoughtRefiner] Critical Failure', {
      context: { error: error.message, stack: error.stack },
    });
    // Fallback: pass through raw text with safe defaults
    return {
      content: rawText.slice(0, MAX_CONTENT_LENGTH),
      mood: DEFAULT_MOOD,
      tags: [],
    };
  }
}

module.exports = { refineThought, VALID_MOODS };
