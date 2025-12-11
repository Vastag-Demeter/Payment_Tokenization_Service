const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: "Too many request, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const fetchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: "Too many detokenization attempts.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const tokenizeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: "Too many tokenization attempts.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  fetchLimiter,
  tokenizeLimiter,
};
