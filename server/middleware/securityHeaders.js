// middleware/securityHeaders.js
const helmet = require("helmet");

const securityHeaders = (app) => {
  // Basic helmet setup
  app.use(helmet());

  // Custom CSP for your application
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          process.env.CLIENT_URL || "http://localhost:3000",
          "https://api.cloudinary.com",
          "https://*.cloudinary.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://*.cloudinary.com",
          "blob:",
        ],
        mediaSrc: [
          "'self'",
          "https://res.cloudinary.com",
          "https://*.cloudinary.com",
          "blob:",
        ],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    })
  );

  // Set strict transport security for HTTPS
  app.use(
    helmet.hsts({
      maxAge: 15552000, // 180 days in seconds
      includeSubDomains: true,
      preload: true,
    })
  );

  // Prevent iframe embedding (clickjacking protection)
  app.use(helmet.frameguard({ action: "deny" }));

  // Disable X-Powered-By header
  app.use(helmet.hidePoweredBy());

  // Prevent MIME type sniffing
  app.use(helmet.noSniff());

  // XSS Protection
  app.use(helmet.xssFilter());

  // Referrer Policy
  app.use(
    helmet.referrerPolicy({
      policy: ["strict-origin-when-cross-origin"],
    })
  );

  // Permissions Policy to limit browser features
  app.use((req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(self), payment=()"
    );
    next();
  });

  // Add Cross-Origin-Resource-Policy header
  app.use(
    helmet.crossOriginResourcePolicy({
      policy: "same-site",
    })
  );

  // Add Cross-Origin-Opener-Policy header
  app.use(
    helmet.crossOriginOpenerPolicy({
      policy: "same-origin",
    })
  );
};

module.exports = securityHeaders;
