// services/ai/copilotContext.js
// Pulls recent posts, thoughts, and metadata from MongoDB
// and formats them into a context string for the copilot's system prompt.

const Post = require('../../models/Post');
const Thought = require('../../models/Thought');

// Cache context for 10 minutes — no need to hit the DB on every chat message
let cachedContext = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function buildContext() {
  const now = Date.now();
  if (cachedContext && now - cacheTimestamp < CACHE_TTL) {
    return cachedContext;
  }

  const [recentPosts, recentThoughts, totalPosts, totalThoughts] =
    await Promise.all([
      Post.find()
        .sort({ eventDate: -1 })
        .limit(30)
        .select('title caption content tags eventDate location')
        .lean(),
      Thought.find()
        .sort({ createdAt: -1 })
        .limit(30)
        .select('content mood tags createdAt')
        .lean(),
      Post.countDocuments(),
      Thought.countDocuments(),
    ]);

  const postLines = recentPosts.map((p) => {
    const date = p.eventDate
      ? new Date(p.eventDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'unknown date';
    const tags = p.tags?.length ? ` [${p.tags.join(', ')}]` : '';
    const location = p.location ? ` — ${p.location}` : '';
    const body = p.caption || p.content || '';
    return `- "${p.title}" (${date}${location})${tags}: ${body.slice(0, 200)}`;
  });

  const thoughtLines = recentThoughts.map((t) => {
    const date = new Date(t.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const mood = t.mood ? ` [${t.mood}]` : '';
    const tags = t.tags?.length ? ` {${t.tags.join(', ')}}` : '';
    return `- (${date})${mood}${tags}: ${t.content.slice(0, 200)}`;
  });

  const context = `
SOLOGRAM STATS:
- ${totalPosts} total posts, ${totalThoughts} total thoughts

RECENT POSTS (newest first):
${postLines.join('\n') || '(none yet)'}

RECENT THOUGHTS (newest first):
${thoughtLines.join('\n') || '(none yet)'}
`.trim();

  cachedContext = context;
  cacheTimestamp = now;

  return context;
}

// Allow manual cache bust if needed (e.g., after a new post)
function clearContextCache() {
  cachedContext = null;
  cacheTimestamp = 0;
}

module.exports = { buildContext, clearContextCache };
