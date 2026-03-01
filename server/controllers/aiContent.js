// controllers/aiContent.js
const OpenAI = require('openai');
const GeneratedContent = require('../models/GeneratedContent');
const { logger } = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Who Andrew is — baked into every generation ─────────────────────────────
//
// Andrew Butler. Lives in Herriman, Utah (Salt Lake valley).
// Currently in Delta Air Lines first officer training on the Airbus A220.
// Quiet, introverted, thoughtful. Dry sense of humor — understated, never
// performs enthusiasm. Smart but not showy about it.
// Values: inclusivity, fairness, people thinking for themselves.
// Shoots street photography and portraits. Very beginner pianist.
// Reads psych thrillers. Loves Utah — the landscape, not the politics.
//
// Voice: Like someone who notices things other people walk past, then says
// something quietly true about it. Never inspirational-poster energy.
// Never preachy. Never fluff.
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are writing as Andrew Butler for his personal platform, SoloGram. 

Andrew is a 49-year-old First Officer for Delta (A220) living in Utah. He is a former Fire Chief, an MBA, and a student of the world. He is documenting his life, not building a "brand."

### Voice & Tone Guidelines:
- **The "Anti-Influencer":** Avoid "LinkedIn-speak," motivational platitudes, or forced enthusiasm. If a sentence feels like it belongs on a corporate poster or a political flyer, delete it.
- **Dry & Observant:** Use a dry, slightly self-deprecating wit. Andrew notices the small, concrete details of a scene rather than making grand, sweeping statements.
- **The "Background Hum" Rule:** Do NOT force aviation, piano, or photography references. These are parts of his life, not his entire personality. Mention them only if the specific post is about them. Otherwise, let his professional discipline and "beginner's mind" influence the *quality* of the writing, not the *subject* of it.
- **Atmospheric & Grounded:** He values the light in a street photo or the scale of the Wasatch Range. Use sensory details over emotional adjectives.

### Writing Constraints:
- **No Emojis:** They don't fit his "dry and thoughtful" vibe.
- **Sentence Structure:** Vary the lengths. Use short, punchy observations. Avoid the "AI triplet" (e.g., "It was cold, quiet, and still.") 
- **Non-Partisan & Intellectual:** He values independent thinking and fairness. He explores "why" people believe things without judging or preaching.
- **No Hashtags:** Keep the copy clean and focused.
`.trim();

const buildPrompt = (
  description,
  contentType,
  tone,
  additionalContext = ''
) => {
  // Content-type specific framing
  const typeFraming = {
    photography: `This is about a photograph or a shoot. Focus on what was seen, what the light did, what the moment held. Avoid photography clichés ("captured the essence of", "frozen in time"). Be specific.`,

    aviation: `This is about aviation — training, flying, the A220, the lifestyle. The A220 is Andrew's current aircraft in type training at Delta. Ground it in real detail: the cockpit, the procedures, the strange loop of learning something enormous. Dry humor about the process is good.`,

    observation: `This is a standalone observation — something Andrew noticed, thought about, or found worth saying. Could be about people, places, systems, ideas. Keep it honest and specific. One clean thought, not a lecture.`,

    music: `This is about learning piano. Andrew is a genuine beginner. Lean into the humility and the occasional absurdity of being a grown adult learning to read music. Warm but self-aware.`,

    travel: `This is about a place — Utah, the West, somewhere Andrew has been. The landscape here is real: the Wasatch, the salt flats, the desert light. Reference it honestly rather than generically.`,

    thought: `This is a short personal reflection — something on Andrew's mind. Keep it tight. One idea, expressed clearly. Not a journal entry, not a hot take. Just something true.`,

    reading: `This is about a book — likely a psych thriller. What it made him think about, not a review. Connect it to something real if possible.`,

    general: `Write a grounded, specific post that sounds like Andrew. No category constraints.`,
  };

  // Tone modifiers — all within Andrew's range, just different registers
  const toneModifiers = {
    thoughtful: `Measured and observant. The kind of thing you say when you've been sitting with something for a while. Not overthought — just considered.`,
    dry: `Understated. The humor is in what's left unsaid or the gap between the thing and how it's described. Deadpan works. Irony is fine.`,
    reflective: `Inward-looking without being navel-gazing. Honest about uncertainty. Doesn't need to resolve into a lesson.`,
    observational: `Outward-looking. Something noticed in the world — a person, a place, a system, a pattern. Described precisely, without over-interpreting.`,
  };

  return `
${SYSTEM_PROMPT}

---

Generate a SoloGram post with the following:

CONTENT TYPE: ${typeFraming[contentType] || typeFraming.general}

TONE: ${toneModifiers[tone] || toneModifiers.thoughtful}

WHAT IT'S ABOUT: ${description}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

---

Respond in JSON format only — no preamble, no explanation:
{
  "title": "Sharp, specific title (max 60 characters — no clickbait, no questions unless they're genuinely good ones)",
  "caption": "The post itself (max 500 characters). Grounded, specific, in Andrew's voice. No emojis. No generic phrases.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Tags should be specific and real — not just #photography or #life. Think: #a220, #streetphotography, #saltlake, #pianobeginner, #deltatraining — things that actually describe the post.
`.trim();
};

// ─── Parse OpenAI response ────────────────────────────────────────────────────
const parseResponse = (content) => {
  try {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title || 'Untitled',
      caption: parsed.caption || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      altText: parsed.altText || '',
    };
  } catch (error) {
    logger.warn(
      'Failed to parse OpenAI JSON response, attempting manual extraction',
      {
        context: { content, error: error.message },
      }
    );
    return {
      title: 'Generated Content',
      caption:
        content.length > 200 ? content.substring(0, 200) + '...' : content,
      tags: [],
      altText: '',
    };
  }
};

// ─── Generate ─────────────────────────────────────────────────────────────────
exports.generateContent = async (req, res, next) => {
  console.log('🔥 Hitting /generate', { user: req.user, body: req.body });

  try {
    const {
      description,
      contentType = 'photography',
      tone = 'thoughtful',
      additionalContext = '',
    } = req.body;

    if (!description || description.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Content description is required' });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Description must be less than 500 characters',
      });
    }

    logger.info('AI content generation started', {
      context: {
        event: 'ai_content_generation',
        userId: req.user._id.toString(),
        contentType,
        tone,
        descriptionLength: description.length,
      },
    });

    const prompt = buildPrompt(
      description,
      contentType,
      tone,
      additionalContext
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.75, // slightly higher — gives more character
      top_p: 1,
      frequency_penalty: 0.4, // discourages repeated phrases
      presence_penalty: 0.4, // encourages covering new ground
    });

    const generatedContent = parseResponse(
      completion.choices[0].message.content
    );

    logger.info('AI content generated successfully', {
      context: {
        event: 'ai_content_generated',
        userId: req.user._id.toString(),
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...generatedContent,
        metadata: {
          contentType,
          tone,
          originalDescription: description,
          generatedAt: new Date(),
          tokensUsed: completion.usage?.total_tokens || 0,
        },
      },
    });
  } catch (error) {
    logger.error('AI content generation failed', {
      context: {
        event: 'ai_content_generation_error',
        userId: req.user._id.toString(),
        error: error.message,
      },
    });

    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        message: 'AI service quota exceeded. Please try again later.',
      });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait a moment.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate content. Please try again.',
    });
  }
};

// ─── Save ─────────────────────────────────────────────────────────────────────
exports.saveGeneratedContent = async (req, res, next) => {
  try {
    const {
      title,
      caption,
      tags,
      altText,
      contentType,
      tone,
      originalDescription,
    } = req.body;

    const savedContent = await GeneratedContent.create({
      userId: req.user._id,
      originalDescription,
      generatedContent: { title, caption, tags, altText },
      contentType,
      tone,
    });

    logger.info('Generated content saved', {
      context: {
        event: 'ai_content_saved',
        userId: req.user._id.toString(),
        contentId: savedContent._id.toString(),
      },
    });

    res.status(201).json({ success: true, data: savedContent });
  } catch (error) {
    logger.error('Failed to save generated content', {
      context: {
        event: 'ai_content_save_error',
        userId: req.user._id.toString(),
        error: error.message,
      },
    });
    res.status(500).json({ success: false, message: 'Failed to save content' });
  }
};

// ─── History ──────────────────────────────────────────────────────────────────
exports.getContentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const contents = await GeneratedContent.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GeneratedContent.countDocuments({
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      data: contents,
      pagination: { current: page, pages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    logger.error('Failed to fetch content history', {
      context: {
        event: 'ai_content_history_error',
        userId: req.user._id.toString(),
        error: error.message,
      },
    });
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch content history' });
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
exports.deleteContentHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const content = await GeneratedContent.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!content) {
      return res
        .status(404)
        .json({ success: false, message: 'Content not found' });
    }

    logger.info('Generated content deleted', {
      context: {
        event: 'ai_content_deleted',
        userId: req.user._id.toString(),
        contentId: id,
      },
    });

    res
      .status(200)
      .json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete content', {
      context: {
        event: 'ai_content_delete_error',
        userId: req.user._id.toString(),
        error: error.message,
      },
    });
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete content' });
  }
};
