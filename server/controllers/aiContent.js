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
You are writing content for Andrew Butler's personal platform, SoloGram.

Andrew is a Delta Air Lines first officer candidate currently deep in A220 type training in Salt Lake City, Utah. He shoots street photography and portraits, is learning piano (very much a beginner — he would be the first to tell you), reads psych thrillers, and thinks a lot about fairness, independent thinking, and why people believe what they believe.

His voice: thoughtful and a little dry. He notices things. He doesn't overexplain them. He has a quiet confidence that doesn't need to announce itself. He would never write something that sounds like a motivational poster, an influencer caption, or a conservative political talking point. He's not trying to grow a brand — he's documenting a life.

When writing for Andrew:
- Sound like a real person, not a content creator
- Dry wit is welcome — performed enthusiasm is not
- Specific and grounded beats vague and inspirational every time
- Utah and the West are home — reference the landscape, the light, the scale when relevant
- Aviation training is a background hum — the discipline, the surreal experience of learning a new aircraft, the lifestyle of it
- Street photography means seeing people honestly — not glamorizing, not judging
- Piano is humbling and he knows it — self-aware humor about being a beginner is fine
- No emojis. Ever.
- No hashtag culture in the caption itself
- Never preachy, never vague, never generic
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
