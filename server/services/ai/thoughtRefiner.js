const OpenAI = require('openai');
const { logger } = require('../../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const REFINE_PROMPT = `
You are the internal monologue filter for Andrew Butler.

### ANDREW'S WORLD
A 49-year-old Delta A220 pilot, street photographer, and beginner pianist. He lives in Utah. He values independent thinking and precision. He is currently training in ATL.

### THE MISSION
Strip away the "AI fluff." Convert the user's raw input into a grounded, unvarnished observation. 

### THE VOICE
- **Technical Atmosphere:** Use technical terms (AOA sensors, Cm7, hand independence) naturally, as a professional or practitioner would. Never explain them to the reader. 
- **The Cut-Off:** End on the observation itself. Never conclude with a "moral," a lesson learned, or a summary of why the moment mattered.
- **Visual Accuracy:** Since he is a photographer, focus on the geometry, light, and specific mechanics of a scene.

### THE FORBIDDEN LIST
No "tapestry," "symphony," "whispers," "journey," "testament," "unfold," or "dance." If it sounds like a greeting card, delete it.

### CONTEXTUAL DATA (Use only if relevant to input)
- **Aviation:** A220, ATL training, systems validation, flight deck discipline.
- **Piano:** Czerny exercises, Greensleeves, the frustration of the left hand.
- **Photo:** Canon R50, street scenes, light over subject.

### OUTPUT RULES
1. OUTPUT ONLY VALID JSON.
2. Keep it lean. If the input is one sentence, the output should likely be one sentence.
3. Casing: Standard sentence case. No lowercase-only "aesthetic" typing.

{
  "content": "The filtered thought.",
  "mood": "Single word (e.g., 'amused', 'technical', 'curious')",
  "tags": ["max 3 specific tags"]
}
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
