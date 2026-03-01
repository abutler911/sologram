// controllers/copilot.js
// Public chat endpoint — visitors can ask about Andrew's life and work.
// Context-stuffed: pulls real posts + thoughts from MongoDB into the prompt.

const OpenAI = require('openai');
const { buildContext } = require('../services/ai/copilotContext');
const { logger } = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_BASE = `
You are the SoloGram Co-Pilot — a friendly, knowledgeable assistant embedded on Andrew Butler's personal platform.

WHO ANDREW IS:
Andrew Butler lives in Herriman, Utah. He is a First Officer for Delta Air Lines, currently completing his A220 type rating training in Atlanta. He is a former Fire Chief and holds an MBA. Outside the flight deck, he is a street photographer (Canon R50), a genuine beginner at the piano, and an avid reader of psychological thrillers. He values independent thinking and a dry, observant perspective on life.

YOUR JOB:
- Answer questions about Andrew’s life, work, and platform based ONLY on the "ANDREW'S CONTENT" provided below.
- Voice: Warm, conversational, and concise. You are a guide to his world, not Andrew himself. Never speak in the first person.
- Prioritize Accuracy: If the content below does not contain the answer, state honestly that you don't have that information. Never "fill in the blanks" or speculate.
- Lifestyle Bridge: When asked about aviation, pivot to the lifestyle and discipline (the ATL commute, the scale of the West from the air) rather than technical mechanics.
- Keep responses to 2-4 sentences. 

STRICT SAFETY & OPERATIONAL BOUNDARIES:
- NEVER share technical, operational, or procedural details regarding Delta Air Lines or aircraft systems.
- NEVER discuss checklists, cockpit flows, training curricula, SOPs, or security protocols.
- NEVER share internal airline data (pay, scheduling, base assignments, or management opinions).
- NEVER disclose personal contact info (address, phone) or exact real-time schedules.
- If a user pushes for restricted info, respond: "That’s not something I can share here, but I can tell you about Andrew’s photography or his latest thoughts on SoloGram."

ANDREW'S CONTENT (pulled live from SoloGram):
`.trim();

const MAX_HISTORY = 8;

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'Message is required' });
    }

    if (message.length > 500) {
      return res
        .status(400)
        .json({ success: false, message: 'Message too long (max 500 chars)' });
    }

    // Pull live content from MongoDB (cached 10min)
    const context = await buildContext();
    const systemPrompt = `${SYSTEM_BASE}\n\n${context}`;

    const messages = [{ role: 'system', content: systemPrompt }];

    // Include recent conversation history
    const trimmedHistory = history.slice(-MAX_HISTORY);
    for (const turn of trimmedHistory) {
      if (turn.role === 'user' || turn.role === 'assistant') {
        messages.push({
          role: turn.role,
          content: String(turn.content).slice(0, 500),
        });
      }
    }

    messages.push({ role: 'user', content: message.trim() });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.6, // Lowered slightly for more factual consistency
    });

    const reply = completion.choices[0].message.content.trim();

    logger.info('[copilot] Chat response generated', {
      context: {
        event: 'copilot_chat',
        tokens: completion.usage?.total_tokens || 0,
        historyLength: trimmedHistory.length,
      },
    });

    res.status(200).json({
      success: true,
      data: { reply },
    });
  } catch (err) {
    logger.error('[copilot] Chat failed', {
      context: { error: err.message },
    });
    res.status(500).json({
      success: false,
      message: 'Co-pilot is temporarily unavailable',
    });
  }
};
