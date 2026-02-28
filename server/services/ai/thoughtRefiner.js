const OpenAI = require('openai');
const { logger } = require('../../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
3. Mood: inspired, reflective, excited, creative, calm, curious, nostalgic, amused.
4. Tags: max 3, lowercase, specific (e.g., "a220", "greensleeves", "atl").

### RESPONSE FORMAT
{"content":"the polished thought","mood":"mood_word","tags":["tag1","tag2"]}
`.trim();

async function refineThought(rawText) {
  const start = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      // This forces the model to output a valid JSON object
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: REFINE_PROMPT },
        { role: 'user', content: rawText },
      ],
      temperature: 0.5, // Lowered slightly for more consistent "Andrew" voice
      max_tokens: 400,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    logger.info('[thoughtRefiner] Refined successfully', {
      elapsed: Date.now() - start,
      tokens: completion.usage?.total_tokens,
    });

    return {
      content: parsed.content || rawText,
      mood: parsed.mood || 'reflective',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [],
    };
  } catch (error) {
    logger.error('[thoughtRefiner] Critical Failure', { error: error.message });
    return { content: rawText, mood: 'reflective', tags: [] };
  }
}

module.exports = { refineThought };
