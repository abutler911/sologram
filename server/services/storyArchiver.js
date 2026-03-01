// services/storyArchiver.js
// Background jobs powered by Agenda:
//   1. archive-expired-stories  — every 5 minutes
//   2. generate-monthly-memoir  — 1st of each month, 8:00 AM UTC

const Agenda = require('agenda');
const Story = require('../models/Story');
const Memoir = require('../models/Memoir');
const { generateMemoir } = require('./ai/memoirGenerator');
const { logger } = require('../utils/logger');
require('dotenv').config();

const mongoURI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/sologram';

const agenda = new Agenda({
  db: {
    address: mongoURI,
    collection: 'scheduledJobs',
    options: {
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    },
  },
  processEvery: '1 minute',
  maxConcurrency: 20,
});

// ── Job 1: Archive expired stories ────────────────────────────────────────────

agenda.define('archive-expired-stories', async (job, done) => {
  try {
    console.log('Running story archiving job...');
    let count = 0;
    try {
      count = await Story.archiveExpired();
    } catch (err) {
      console.error('Error in Story.archiveExpired():', err);
    }
    console.log(`Successfully archived ${count} expired stories`);
    done();
  } catch (error) {
    console.error('Story archiving job failed:', error);
    done(error);
  }
});

// ── Job 2: Generate previous month's memoir ───────────────────────────────────

agenda.define('generate-monthly-memoir', async (job, done) => {
  try {
    // Figure out the previous month
    const now = new Date();
    let month = now.getMonth(); // 0-indexed, so March 1 → getMonth() = 2, we want Feb = 2 (1-indexed)
    let year = now.getFullYear();

    // If current month is January (0), previous month is December of last year
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    // Otherwise, month is already the correct 1-indexed value for the previous month
    // (e.g., March = getMonth() 2, which is February in 1-indexed)

    logger.info(
      `[memoir-cron] Checking memoir for month=${month}, year=${year}`
    );

    // Check if it already exists (manual trigger or re-run)
    const existing = await Memoir.findOne({ month, year });
    if (existing) {
      logger.info(
        `[memoir-cron] Memoir for ${month}/${year} already exists, skipping`
      );
      return done();
    }

    // Generate it
    const memoir = await generateMemoir(month, year, 'scheduled');
    logger.info(`[memoir-cron] Memoir generated: "${memoir.title}"`, {
      context: { memoirId: memoir._id.toString(), month, year },
    });

    done();
  } catch (err) {
    // Duplicate key = race condition (manual + cron fired simultaneously)
    if (err.code === 11000) {
      logger.info(
        '[memoir-cron] Memoir already exists (duplicate key), skipping'
      );
      return done();
    }
    logger.error('[memoir-cron] Failed to generate memoir', {
      context: { error: err.message, stack: err.stack },
    });
    done(err);
  }
});

// ── Setup ─────────────────────────────────────────────────────────────────────

const setupAgenda = async () => {
  try {
    await agenda.start();
    console.log('Agenda started successfully');

    // Story archiving — every 5 minutes
    await agenda.every('5 minutes', 'archive-expired-stories');
    console.log('Archiving job scheduled to run every 5 minutes');

    // Memoir generation — 1st of every month at 8:00 AM UTC
    // Cron: minute hour day-of-month month day-of-week
    await agenda.every('0 8 2 * *', 'generate-monthly-memoir');
    console.log(
      'Memoir generation scheduled for 2nd of each month at 08:00 UTC'
    );

    // Run initial story archiving
    await agenda.now('archive-expired-stories');
    console.log('Initial archiving job triggered');

    // On startup: check if we missed a memoir (e.g., server was down on the 1st)
    await checkMissedMemoir();

    return agenda;
  } catch (err) {
    console.error('Failed to setup Agenda:', err);
    return null;
  }
};

// ── Startup catch-up ──────────────────────────────────────────────────────────
// If the server was down when the cron was supposed to fire, generate it now.

async function checkMissedMemoir() {
  try {
    const now = new Date();
    let prevMonth = now.getMonth(); // 0-indexed current month = 1-indexed previous month
    let prevYear = now.getFullYear();

    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    // Only check if today is the 2nd–4th of the month
    // (gives a grace window for server restarts)
    if (now.getDate() < 2 || now.getDate() > 4) return;

    const existing = await Memoir.findOne({ month: prevMonth, year: prevYear });
    if (!existing) {
      logger.info(
        `[memoir-cron] Missed memoir detected for ${prevMonth}/${prevYear}, generating now`
      );
      await agenda.now('generate-monthly-memoir');
    }
  } catch (err) {
    logger.error('[memoir-cron] Missed memoir check failed', {
      context: { error: err.message },
    });
  }
}

// ── Shutdown ──────────────────────────────────────────────────────────────────

const gracefulShutdown = async () => {
  try {
    console.log('Stopping Agenda...');
    await agenda.stop();
    console.log('Agenda stopped');
  } catch (err) {
    console.error('Agenda shutdown failed:', err);
  }
};

module.exports = {
  agenda,
  setupAgenda,
  gracefulShutdown,
};
