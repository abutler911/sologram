// controllers/aiVision.js
const OpenAI = require('openai');
const { logger } = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VISION_PROMPT = `
You are writing a SoloGram post for Andrew Butler based on this photograph.

WHO ANDREW IS:
Andrew Butler. Lives in Herriman, Utah. Delta Air Lines first officer candidate in A220 type rating training. Street and portrait photographer. Beginner pianist. Reads psych thrillers. Quiet, introverted, dry humor.

YOUR JOB:
Look at this image carefully. Write a post about it in Andrew's voice.

VOICE RULES:
- First person. This is Andrew posting about his own photo.
- Sound like a real person, not a content creator.
- Be specific about what you see — the light, the composition, the moment, the place.
- Dry wit welcome. Performed enthusiasm is not.
- No emojis. No hashtag culture. No "captured this gem" energy.
- If it's a landscape, talk about the place honestly.
- If it's a portrait, talk about the person or the moment.
- If it's food/travel/everyday, find the interesting angle.
- Caption should be 1-3 sentences. Tight. Not a journal entry.

Respond with ONLY valid JSON, no markdown fences:
{
  "title": "Sharp, specific title (max 60 chars — no clickbait)",
  "caption": "The caption in Andrew's voice (max 300 chars). Grounded, specific, no emojis.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Tags should be specific and real — not just #photography. Think: #streetphotography, #saltlake, #wasatch, #a220, #utah — things that describe what's actually in the image.
`.trim();

exports.generateCaption = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res
        .status(400)
        .json({ success: false, message: 'imageUrl is required' });
    }

    if (!imageUrl.startsWith('http')) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid image URL' });
    }

    logger.info('[aiVision] Generating caption from image', {
      context: { event: 'ai_vision_caption', imageUrl: imageUrl.slice(0, 80) },
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_PROMPT },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          ],
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content.trim();
    const tokens = completion.usage?.total_tokens || 0;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      logger.warn('[aiVision] JSON parse failed, using raw', {
        context: { raw: raw.slice(0, 200) },
      });
      parsed = { title: '', caption: raw, tags: [] };
    }

    logger.info('[aiVision] Caption generated', {
      context: { tokens, title: parsed.title },
    });

    res.status(200).json({
      success: true,
      data: {
        title: parsed.title || '',
        caption: parsed.caption || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
        tokensUsed: tokens,
      },
    });
  } catch (err) {
    logger.error('[aiVision] Caption generation failed', {
      context: { error: err.message },
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate caption from image',
    });
  }
};
