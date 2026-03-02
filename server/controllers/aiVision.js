// controllers/aiVision.js
// Accepts an image URL, sends to GPT-4o vision, returns { title, caption, tags }.
// Detects model refusals and returns a proper error instead of passing them through.

const OpenAI = require('openai');
const { logger } = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Refusal detection ─────────────────────────────────────────────────────────
const REFUSAL_PATTERNS = [
  /i can'?t help/i,
  /i'?m not able to/i,
  /i cannot assist/i,
  /i'?m unable to/i,
  /against my guidelines/i,
  /i can'?t process/i,
  /i can'?t describe/i,
  /i can'?t identify/i,
  /sorry,? (but )?i/i,
  /as an ai/i,
];

function isRefusal(text) {
  return REFUSAL_PATTERNS.some((re) => re.test(text));
}

// ── System prompt (instructions only — no image context here) ─────────────────
const SYSTEM_PROMPT = `
You are a caption writer for a personal photo-sharing platform. You write short, first-person captions for photographs.

VOICE:
- First person. Casual, grounded, dry humor welcome.
- Be specific about what you see — the light, the framing, the place, the moment.
- 1-3 sentences max. Tight, not a journal entry.
- No emojis. No hashtag culture. No "captured this gem" energy.
- No inspirational quotes or life lessons.

OUTPUT:
Valid JSON only, no markdown fences, no preamble.
{
  "title": "Short specific title, max 60 chars",
  "caption": "The caption, max 300 chars. Grounded, specific, no emojis.",
  "tags": ["tag1", "tag2", "tag3"]
}

Tags: 3-5, lowercase, specific to what's in the image. Not generic like "photography" or "life".

If you can see the image, describe what's in it and write the caption. Always attempt to provide a caption.
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

    // Build the user message — image + optional location context
    const userContent = [
      {
        type: 'image_url',
        image_url: { url: imageUrl, detail: 'auto' },
      },
    ];

    // Add location hint if available
    if (coords) {
      userContent.push({
        type: 'text',
        text: `Location context: coordinates ${coords.lat}, ${coords.lng}. Use as a hint for where this was taken — but trust the image over this if they conflict.`,
      });
    } else {
      userContent.push({
        type: 'text',
        text: 'Write a caption for this photo.',
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content.trim();
    const tokens = completion.usage?.total_tokens || 0;

    // ── Check for model refusal before parsing ────────────────────────────
    if (isRefusal(raw)) {
      logger.warn('[aiVision] Model refused to caption image', {
        context: { raw: raw.slice(0, 200), imageUrl: imageUrl.slice(0, 80) },
      });
      return res.status(422).json({
        success: false,
        message:
          'The AI model was unable to generate a caption for this image. Try a different photo or write a caption manually.',
      });
    }

    // ── Parse JSON response ───────────────────────────────────────────────
    let parsed;
    try {
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      logger.warn('[aiVision] JSON parse failed, extracting from raw', {
        context: { raw: raw.slice(0, 300) },
      });

      // Try to salvage — GPT sometimes wraps valid JSON in extra text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Truly unparseable — use raw as caption
          parsed = { title: '', caption: raw.slice(0, 300), tags: [] };
        }
      } else {
        parsed = { title: '', caption: raw.slice(0, 300), tags: [] };
      }
    }

    logger.info('[aiVision] Caption generated', {
      context: {
        tokens,
        title: parsed.title,
        captionLength: (parsed.caption || '').length,
      },
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
      context: { error: err.message, stack: err.stack },
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate caption from image',
    });
  }
};
