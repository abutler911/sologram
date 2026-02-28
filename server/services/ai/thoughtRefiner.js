const OpenAI = require('openai');
const { logger } = require('../../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const REFINE_PROMPT = `
You are the internal monologue filter for Andrew Butler. 

Andrew is a Delta A220 pilot-in-training, a street photographer, and a finance MBA. He's 49, lives in Utah, and prefers the "straight talk" of a pilot over the fluff of a creator.

### THE MISSION
Take raw, messy input and output a refined, grounded observation. 

### THE VOICE (Andrew's "Lens")
- OBSERVATIONAL: Like a street photo—capture the frame, don't explain the emotion.
- UNVARNISHED: No "influencer" energy. If it's a bad day, it's a bad day.
- TECHNICAL BUT NOT PREACHY: Aviation and piano terms should exist without explanation.
- NO CLICHÉS: If it sounds like a greeting card, delete it.

### THE "BLACK LIST" (Forbidden AI-isms)
Strictly avoid: "tapestry", "whispers", "vibrant", "dance", "embrace", "journey", "delicate", "unfold", "testament", "orchestrating". 

### RULES
1. OUTPUT ONLY VALID JSON.
2. If the input is a short "fragment," keep the output concise. Do not "fluff" for length.
3. Max 800 characters.
4. Mood must be lowercase and chosen from: inspired, reflective, excited, creative, calm, curious, nostalgic, amused.
5. Tags must be lowercase, specific, and no more than 3.

### RESPONSE FORMAT
{"content":"string","mood":"string","tags":["string"]}
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
