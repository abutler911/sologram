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
    general: "Create engaging social media content for a general post",
    product:
      "Create compelling product showcase content that highlights features and benefits",
    "behind-scenes":
      "Create authentic behind-the-scenes content that shows the creative process",
    educational:
      "Create informative educational content that teaches or explains something valuable",
    lifestyle:
      "Create aspirational lifestyle content that resonates with the audience",
    announcement:
      "Create exciting announcement content that builds anticipation",
  };

  const toneModifiers = {
    casual: "Keep the tone conversational, friendly, and approachable",
    professional: "Maintain a professional, polished, and authoritative tone",
    playful: "Use a fun, energetic, and playful tone with appropriate emojis",
    inspirational:
      "Create uplifting, motivational content that inspires action",
    minimalist: "Keep it clean, simple, and to the point",
  };

  return `
${basePrompts[contentType] || basePrompts.general}.

Content Description: ${description}
${additionalContext ? `Additional Context: ${additionalContext}` : ""}

Tone: ${toneModifiers[tone] || toneModifiers.casual}

Please provide the response in the following JSON format:
{
  "title": "An engaging title (max 60 characters)",
  "caption": "A compelling caption (2-3 sentences, include 1-2 relevant emojis)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "altText": "Brief description for accessibility (if image-related)"
}

Guidelines:
- Keep titles punchy and attention-grabbing
- Make captions authentic and engaging
- Include 5 relevant hashtags without the # symbol
- Ensure all content aligns with the specified tone
- Make it suitable for Instagram/social media platforms
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
