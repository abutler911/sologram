// server.js
// ----------- Load Environment Variables -----------
require('dotenv').config();

// ----------- Core Imports -----------
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// ----------- Security & Performance -----------
const helmet = require('helmet'); // secure HTTP headers
const compression = require('compression'); // gzip/deflate responses
const rateLimit = require('express-rate-limit'); // basic rate limiting
const cors = require('cors'); // CORS handling
const mongoSanitize = require('express-mongo-sanitize'); // prevent NoSQL injection

// ----------- Logging -----------
const morgan = require('morgan'); // HTTP request logging
const { logger } = require('./utils/logger'); // custom logger (e.g., Logtail)

// ----------- Custom Middleware & Utilities -----------
const securityHeaders = require('./middleware/securityHeaders');
const requestIdMiddleware = require('./middleware/requestId');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const linksRouter = require('./routes/links');

// ----------- Background Jobs -----------
const {
  setupAgenda,
  gracefulShutdown: agendaShutdown,
} = require('./services/storyArchiver');

// ----------- Route Handlers -----------
const postRoutes = require('./routes/posts');
const storyRoutes = require('./routes/stories');
const authRoutes = require('./routes/auth');
const collectionRoutes = require('./routes/collections');
const archivedStoryRoutes = require('./routes/archivedStories');
const analyticsRoutes = require('./routes/analytics');
const thoughtsRoutes = require('./routes/thoughts');
const cloudinaryRoutes = require('./routes/cloudinaryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const aiContentRoutes = require('./routes/admin/aiContent');
const commentRoutes = require('./routes/comments');
const quickThoughtRoutes = require('./routes/webhooks/quickThought');
const copilotRoutes = require('./routes/copilot');

// ----------- App Initialization -----------
const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
const PORT = process.env.PORT || 5000;

// ----------- Environment Variable Check -----------
(function checkEnvVars() {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    logger.error(`Missing env vars: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
})();

// ----------- Security & Performance Middleware -----------
securityHeaders(app); // custom CSP/HSTS/etc.
app.use(helmet()); // apply secure headers

app.use(
  cors({
    // CORS config
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            'https://thesologram.com',
            'https://www.thesologram.com',
            'https://sologram.onrender.com',
          ]
        : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
);
app.use(compression()); // compress responses
app.use(mongoSanitize()); // sanitize inputs against NoSQL injection

// ----------- Request Logging -----------
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// ----------- Utility Middleware -----------
app.use(requestIdMiddleware); // attach unique request ID
app.use(cookieParser()); // parse cookies
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ extended: true, limit: '300mb' }));
app.use(linksRouter);

// ----------- Rate Limiting for Auth -----------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// ----------- Mount API Routes -----------
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/archived-stories', archivedStoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/thoughts/quick', quickThoughtRoutes);
app.use('/api/thoughts', thoughtsRoutes);
app.use('/api/admin/cloudinary', cloudinaryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/ai-content', aiContentRoutes);
app.use('/api', commentRoutes);
app.use('/api/copilot', copilotRoutes);

// ----------- Lightweight Health Check -----------
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ----------- Serve Static Assets (Production) -----------
// if (process.env.NODE_ENV === "production") {
//   const clientBuild = path.join(__dirname, "../client/build");
//   app.use(express.static(clientBuild));

//   // React catch-all for non-API routes
//   app.get(/^\/(?!api|health).*/, (req, res) => {
//     res.sendFile(path.resolve(clientBuild, "index.html"));
//   });
// }

// ----------- Root Route -----------
app.get('/', (req, res) => {
  res.send(`🚀 SoloGram backend live on port ${PORT}!`);
});

// ----------- 404 Handler -----------
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// ----------- Global Error Handler -----------
app.use(errorHandler);

// ----------- Start Server & Background Jobs -----------
(async function start() {
  try {
    // Connect to MongoDB
    const connectDB = require('./config/db');
    await connectDB();

    // Initialize Agenda jobs
    await setupAgenda();
    logger.info('Agenda initialized');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });

    // Graceful shutdown logic
    const graceful = async () => {
      logger.info('Graceful shutdown initiated');
      // Force exit after 10s
      const timer = setTimeout(() => {
        logger.error('Shutdown timed out, forcing exit');
        process.exit(1);
      }, 10000);

      try {
        await agendaShutdown();
        await mongoose.connection.close();
        clearTimeout(timer);
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (err) {
        clearTimeout(timer);
        logger.error('Shutdown error', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', graceful);
    process.on('SIGTERM', graceful);
    server.on('error', (err) => logger.error('Server error', err));
  } catch (err) {
    logger.error('Server startup failed', err);
    setTimeout(() => process.exit(1), 2000);
  }
})();

// ----------- Ensure Logs Flush Before Exit -----------
process.on('beforeExit', async () => {
  const { safeFlush } = require('./utils/logger');
  await safeFlush();
});
