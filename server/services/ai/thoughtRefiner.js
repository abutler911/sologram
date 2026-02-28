// services/ai/thoughtRefiner.js
// Takes raw text and produces a polished thought in Andrew's voice.
// Uses gpt-4o-mini for speed + cost.

const OpenAI = require('openai');
const { logger } = require('../../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const REFINE_PROMPT = `
You are a writing assistant for Andrew Butler's personal platform, SoloGram.

Andrew sent you a raw thought — an observation, idea, or moment from his day.
Your job: polish it into a short, publishable thought in his voice. Not a rewrite.
A refinement. Keep his intent. Keep it real.

Andrew's voice:
- Quiet, dry, observational. Notices things other people walk past.
- Never sounds like a motivational poster, influencer, or content creator.
- Specific beats vague. Grounded beats inspirational.
- No emojis. No hashtag culture. No performed enthusiasm.
- Understated humor is welcome. Preachy is never welcome.

Context: He's a Delta Air Lines first officer candidate in A220 training,
lives in the Salt Lake valley, shoots street photography, learning piano (beginner),
reads psych thrillers, values fairness and independent thinking.

Rules:
1. Output ONLY valid JSON — no preamble, no markdown fences, no explanation.
2. Keep the thought under 280 characters when possible. Max 800.
3. Don't inflate a simple observation into a philosophical treatise.
4. If the raw text is already good, barely touch it.
5. Infer mood from the content. Pick ONE from: inspired, reflective, excited, creative, calm, curious, nostalgic, amused.
6. Generate 1-3 relevant, specific tags (no #, lowercase). Think: "a220", "streetphoto", "utah", "piano", "training" — not "life" or "thoughts".

Respond with:
{"content":"the polished thought","mood":"one_mood","tags":["tag1","tag2"]}
`.trim();

async function refineThought(rawText) {
  const start = Date.now();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: REFINE_PROMPT },
      { role: 'user', content: rawText },
    ],
    max_tokens: 300,
    temperature: 0.6,
  });

  const raw = completion.choices[0].message.content.trim();

  logger.info('[thoughtRefiner] OpenAI responded', {
    context: {
      event: 'thought_refine',
      elapsed: Date.now() - start,
      tokens: completion.usage?.total_tokens || 0,
    },
  });

  try {
    const parsed = JSON.parse(raw);
    return {
      content: parsed.content || rawText,
      mood: parsed.mood || 'creative',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };
  } catch {
    logger.warn('[thoughtRefiner] JSON parse failed, using raw text', {
      context: { raw },
    });
    return { content: rawText, mood: 'creative', tags: [] };
  }
}

module.exports = { refineThought };
