const crypto = require("crypto");

function getAllowedKeys() {
  const multi = process.env.TOKEN_VAULT_API_KEYS;
  return multi
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function safeEqual(a, b) {
  try {
    const BufA = Buffer.from(a);
    const BufB = Buffer.from(b);
    if (BufA.length !== BufB.length) return false;
    return crypto.timingSafeEqual(BufA, BufB);
  } catch (error) {
    console.log(`[AUTH]: ${error.message}`);
    return false;
  }
}

function apiKeyAuth(options = {}) {
  const headerName = (options.headerName || "x-api-key").toLowerCase();
  const allowedKeys = getAllowedKeys();
  if (!allowedKeys.length) {
    console.warn(
      "[AUTH]: No API keys configured for Token Vault (TOKEN_VAULT_API_KEYS)"
    );
  }

  return (req, res, next) => {
    const provided = (req.header(headerName) || "").trim();

    if (!provided) {
      console.warn(
        `[AUTH]: Missing API key from ${req.ip} ${req.method} ${req.originalUrl}`
      );
      return res.status(401).json({ error: "Missing API key" });
    }

    let matchedKey = null;
    for (const key of allowedKeys) {
      if (safeEqual(key, provided)) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      console.warn(
        `[AUTH] Invalid API key attempt from ${req.ip} ${req.method} ${req.originalUrl}`
      );
      return res.status(401).json({ error: "Invalid API key" });
    }

    let serviceName = "unknown";
    if (safeEqual(provided, process.env.WEBHOOK_SERVICE_KEY))
      serviceName = "webshop";
    else if (safeEqual(provided, process.env.TRANSACTION_SERVICE_KEY))
      serviceName = "transaction";
    else if (safeEqual(provided, process.env.DUMMY_BANK_KEY))
      serviceName = "dummy_bank";

    req.auth = { apiKeyPresent: true, serviceName };
    console.log(`[AUTH]: Service ${serviceName} made call from IP ${req.ip}`);

    next();
  };
}

module.exports = apiKeyAuth;
