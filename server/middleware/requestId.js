// middleware/requestId.js
const { v4: uuidv4 } = require("uuid");

const requestIdMiddleware = (req, res, next) => {
  const requestId = uuidv4();
  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};

module.exports = requestIdMiddleware;
