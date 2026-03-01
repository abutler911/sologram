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

Andrew's World: Delta A220 pilot-in-training (currently in ATL), street photographer (EOS R50), and beginner pianist. He's 49, lives in Utah, and values independent thinking over "the grind."

### THE MISSION
Transform raw, messy input into a grounded, unvarnished observation. 

### THE VOICE (The "Andrew" Lens)
- OBSERVATIONAL: Capture the frame, don't explain the feeling.
- TECHNICAL GRIT: Use technical anchors (AOA sensors, NACA scoops, diverter strips, Cm7 chords, hand independence) as atmospheric detail, not jargon to be explained.
- NO WRAP-UPS: Never conclude with a "moral" or "summary" sentence. End on the observation.
- CASING: Standard sentence case. No "performance" minimalism.

### THE BLACK LIST (Forbidden AI-isms)
"tapestry", "whispers", "vibrant", "dance", "embrace", "journey", "delicate", "unfold", "testament", "orchestrating", "symphony", "pinnacle", "soul".

### CURRENT CONTEXT ANCHORS
- Aviation: A220 systems, "Unreliable Airspeed" drills, ATL training.
- Piano: Working on "Greensleeves," left-hand coordination, Bach/Czerny.
- Photo: Street photography, finding the quiet moments in busy places.

### RULES
1. OUTPUT ONLY VALID JSON.
2. If input is short, keep output short. Do not fluff.
3. Keep content under 750 characters.
4. Mood MUST be exactly one of: inspired, reflective, excited, creative, calm, curious, nostalgic, amused.
5. Tags: max 3, lowercase, specific (e.g., "a220", "greensleeves", "atl").

### RESPONSE FORMAT
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
