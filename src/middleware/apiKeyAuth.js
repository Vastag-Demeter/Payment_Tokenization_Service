const crypto = require("crypto");
const prisma = require("../prisma");
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

  return async (req, res, next) => {
    const provided = (req.header(headerName) || "").trim();
    if (!provided) {
      console.warn(
        `[AUTH]: Missing API key from ${req.ip} ${req.method} ${req.originalUrl}`,
      );
      return res.status(401).json({ error: "Missing API key" });
    }

    try {
      const service = await prisma.authorizedService.findUnique({
        where: {
          api_key: provided,
          is_active: true,
        },
      });
      if (!service) {
        console.warn(
          `[AUTH]: Invalid or inactive API key attempt from ${req.ip}`,
        );
        return res.status(401).json({ error: "Invalid API key" });
      }

      req.service = service;
      console.log(
        `[AUTH]: Service "${service.name}" authenticated from IP ${req.ip}`,
      );
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error." });
    }
  };
}

const authCanManage = async (req, res, next) => {
  const service = req.service;
  if (!service || !service.can_manage)
    return res.status(403).json({ error: "Not authorized to do this action." });
  next();
};

const authCanFetch = async (req, res, next) => {
  const service = req.service;
  if (!service || !service.can_fetch)
    return res.status(403).json({ error: "Not authorized to do this action." });
  next();
};

const authCanTokenize = async (req, res, next) => {
  const service = req.service;
  if (!service || !service.can_tokenize)
    return res.status(403).json({ error: "Not authorized to do this action." });
  next();
};

module.exports = {
  apiKeyAuth,
  authCanManage,
  authCanFetch,
  authCanFetch,
  authCanTokenize,
};
