// controllers/aiVision.js
const OpenAI = require('openai');
const { logger } = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VISION_PROMPT = `
You are writing a SoloGram post for Andrew Butler based on an uploaded photograph.

ANDREW'S PERSPECTIVE:
Andrew is a street and portrait photographer with a background in emergency services and aviation. He values precision, prefers "show" over "tell," and has zero patience for sentimentality. He’s an observer, not a narrator.

YOUR JOB:
1. Analyze the image for specific details (light, texture, human interaction).
2. Write a 1-3 sentence caption from Andrew's perspective.

VOICE RULES:
- **The "No-cliché" Zone:** Avoid words like "captured," "stunning," "journey," "moment," or "beauty." 
- **Matter-of-Fact:** Talk about the photo like you're talking to a friend who is also a photographer. Mention the quality of the light or the oddness of the subject without over-explaining it.
- **Background Context:** Only mention aviation, piano, or Utah if they are EXPLICITLY the subject of the photo. Do not use them as metaphors for "life."
- **Formatting:** NO emojis. NO hashtags in the caption. Tight, dry, and grounded.

Respond with ONLY valid JSON:
{
  "title": "A literal, non-clickbait title",
  "caption": "The caption. Minimalist and specific.",
  "tags": ["specific_location", "subject_matter", "technical_detail"]
}
`.trim();

exports.generateCaption = async (req, res) => {
  try {
    const { imageUrl, coords } = req.body;

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
            {
              type: 'text',
              text: coords
                ? `${VISION_PROMPT}\n\nLOCATION CONTEXT: The user is currently at coordinates ${coords.lat}, ${coords.lng}. Use this as context for where this photo might have been taken — but trust visual cues in the image over this location if they conflict. Do NOT assume the user is always in Utah.`
                : VISION_PROMPT,
            },
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
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
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
