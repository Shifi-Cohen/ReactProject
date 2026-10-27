const rateLimit = require("express-rate-limit");

const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    res.status(429).json({
      message: "נשלחו יותר מדי פניות. נסי שוב מאוחר יותר.",
    });
  },
});

module.exports = { inquiryLimiter };
