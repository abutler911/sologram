// controllers/aiContent.js
const OpenAI = require("openai");
const GeneratedContent = require("../models/GeneratedContent");
const { logger } = require("../utils/logger");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Build dynamic prompts based on content type
const buildPrompt = (
  description,
  contentType,
  tone,
  additionalContext = ""
) => {
  const basePrompts = {
    general: "Write a clever and engaging social media post",
    product:
      "Create a witty, engaging product showcase caption that highlights the product's uniqueness and appeal",
    "behind-scenes":
      "Write an authentic and personal behind-the-scenes caption that tells a fun or insightful story",
    educational:
      "Write a smart and digestible educational caption that teaches something interesting or useful",
    lifestyle:
      "Write a stylish, relatable lifestyle caption that paints a vibe or sets a mood",
    announcement:
      "Write a bold and exciting caption that makes an announcement feel fun and fresh",
  };

  const toneModifiers = {
    casual:
      "Use a friendly, confident tone like you're talking to a smart friend. Avoid clichés.",
    professional:
      "Keep it polished and articulate, but still personal and engaging. No buzzwords.",
    playful: "Inject humor, sarcasm, or witty metaphors. No emojis.",
    inspirational:
      "Be poetic and thought-provoking, not cheesy or preachy. Avoid overused motivational lines.",
    minimalist:
      "Keep it ultra short, cool, and clever. Every word should matter.",
  };

  return `
You are an expert solo content creator writing for a visual-first social media platform called SoloGram. You are the only user, and the content reflects your personality: smart, fun, and free of fluff. Never use emojis.

Write content with the following constraints:
- Title (max 60 characters): A sharp, clever title that hooks attention
- Caption (max 500 characters): Witty, playful, or introspective tone based on input. No emojis. Avoid clichés and generic influencer speak.
- Tags: Up to 5 relevant, lowercase single-word hashtags without the # symbol

Description: ${description}
${additionalContext ? `Context: ${additionalContext}` : ""}

Tone: ${toneModifiers[tone] || toneModifiers.casual}

Respond in JSON format:
{
  "title": "Title here",
  "caption": "Caption here (max 500 characters)",
  "tags": ["tag1", "tag2", "tag3"]
}
`.trim();
};

// Parse OpenAI response and ensure proper format
const parseResponse = (content) => {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);

    // Validate required fields and provide defaults
    return {
      title: parsed.title || "Untitled Post",
      caption: parsed.caption || "Check out this amazing content!",
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.slice(0, 5)
        : ["content", "social", "post"],
      altText: parsed.altText || "",
    };
  } catch (error) {
    // If JSON parsing fails, try to extract content manually
    logger.warn(
      "Failed to parse OpenAI JSON response, attempting manual extraction",
      {
        context: { content, error: error.message },
      }
    );

    return {
      title: "Generated Content",
      caption:
        content.length > 200 ? content.substring(0, 200) + "..." : content,
      tags: ["content", "ai", "generated"],
      altText: "",
    };
  }
};

exports.generateContent = async (req, res, next) => {
  console.log("🔥 Hitting /generate", {
    user: req.user,
    body: req.body,
  });

  try {
    const {
      description,
      contentType = "general",
      tone = "casual",
      additionalContext = "",
    } = req.body;

    // Validate required fields
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Content description is required",
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Description must be less than 500 characters",
      });
    }

    logger.info("AI content generation started", {
      context: {
        event: "ai_content_generation",
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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
    });

    const generatedContent = parseResponse(
      completion.choices[0].message.content
    );

    // Log successful generation
    logger.info("AI content generated successfully", {
      context: {
        event: "ai_content_generated",
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
    logger.error("AI content generation failed", {
      context: {
        event: "ai_content_generation_error",
        userId: req.user._id.toString(),
        error: error.message,
      },
    });

    // Handle specific OpenAI errors
    if (error.code === "insufficient_quota") {
      return res.status(429).json({
        success: false,
        message: "AI service quota exceeded. Please try again later.",
      });
    }

    if (error.code === "rate_limit_exceeded") {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment before trying again.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate content. Please try again.",
    });
  }
};

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
      generatedContent: {
        title,
        caption,
        tags,
        altText,
      },
      contentType,
      tone,
    });

    logger.info("Generated content saved", {
      context: {
        event: "ai_content_saved",
        userId: req.user._id.toString(),
        contentId: savedContent._id.toString(),
      },
    });

    res.status(201).json({
      success: true,
      data: savedContent,
    });
  } catch (error) {
    logger.error("Failed to save generated content", {
      context: {
        event: "ai_content_save_error",
        userId: req.user._id.toString(),
        error: error.message,
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to save content",
    });
  }
};

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
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch content history", {
      context: {
        event: "ai_content_history_error",
        userId: req.user._id.toString(),
        error: error.message,
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch content history",
    });
  }
};

exports.deleteContentHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const content = await GeneratedContent.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    logger.info("Generated content deleted", {
      context: {
        event: "ai_content_deleted",
        userId: req.user._id.toString(),
        contentId: id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Content deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete content", {
      context: {
        event: "ai_content_delete_error",
        userId: req.user._id.toString(),
        error: error.message,
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete content",
    });
  }
};
