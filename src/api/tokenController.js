const prisma = require("../prisma");
const crypto = require("crypto");

const encryptionService = require("../services/encryptionService");

function detectCardType(cardNumber) {
  if (!cardNumber || typeof cardNumber !== "string") {
    return "Unknown";
  }
  const cleaned = cardNumber.replace(/\D/g, "");

  if (/^4\d{12,18}$/.test(cleaned)) return "VISA";
  if (/^5[1-5]\d{14}$/.test(cleaned)) return "MASTERCARD";
  if (/^3[47]\d{13}$/.test(cleaned)) return "AMEX";
  if (/^(6011|65|64[4-9])\d{12,15}$/.test(cleaned)) return "DISCOVER";
  if (/^35(2[89]|[3-8]\d)\d{12}$/.test(cleaned)) return "JCB";
  if (/^62\d{14,17}$/.test(cleaned)) return "UNIONPAY";

  return "UNKNOWN";
}

const generateFingerPrint = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\s+/g, "");
  return crypto.createHash("sha256").update(cleanNumber).digest("hex");
};

const isValidCard = (cardNumber) => {
  const digits = cardNumber.replace(/\s+/g, "").split("").map(Number);
  let sum = 0;
  let isSecond = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (isSecond) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isSecond = !isSecond;
  }
  return sum % 10 === 0;
};

const isValidExpiryDate = (expiryDate) => {
  const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  if (!regex.test(expiryDate)) return false;

  const [month, year] = expiryDate.split("/").map(Number);
  const fullYear = 2000 + year;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  if (fullYear < currentYear) return false;
  if (fullYear === currentYear && month < currentMonth) return false;
  return true;
};

async function tokenizePaymentData(req, res) {
  const { card_number, expiry_date, holder_name } = req.body;
  const serviceID = req.service.id;
  const cleanNumber = card_number.replace(/\s+/g, "");

  if (!cleanNumber || !expiry_date || !holder_name) {
    return res.status(400).json({ error: "Missing required payment data." });
  }
  if (!isValidCard(cleanNumber))
    return res.status(400).json({ error: "Card number is not valid." });

  if (!isValidExpiryDate(expiry_date))
    return res
      .status(400)
      .json({ error: "Expiration date must be in format: MM/YY" });
  try {
    const fingerprint = generateFingerPrint(cleanNumber);

    let card = await prisma.card.findUnique({
      where: {
        fingerprint,
      },
    });

    if (!card) {
      const sensitiveDataJson = JSON.stringify({
        cleanNumber,
      });
      const encryptedPayLoad = encryptionService.encrypt(sensitiveDataJson);
      const type = detectCardType(cleanNumber);
      card = await prisma.card.create({
        data: {
          fingerprint: fingerprint,
          encrypted_data: encryptedPayLoad,
          expiration_date: expiry_date,
          last_four_digits: card_number.slice(-4),
          card_holder_name: holder_name,
          type: type,
          is_active: true,
        },
      });
    }

    const newToken = crypto.randomBytes(16).toString("hex");

    await prisma.paymentToken.create;
    const paymentToken = await prisma.paymentToken.create({
      data: {
        token: newToken,
        card_id: card.id,
        service_id: serviceID,
        is_active: true,
      },
    });

    res.status(201).json({
      msg: "Card tokenized successfully.",
      data: {
        token: paymentToken.token,
        last_four: card.last_four_digits,
        expiry_date: card.expiration_date,
        type: card.type,
      },
    });
  } catch (error) {
    console.error("[ERROR]: Error during tokenization: ", error.message);
    res.status(500).json({ error: "Failed to process tokenization request. " });
  }
}

async function getTokenData(req, res) {
  const { token } = req.body;
  const service = req.service;
  if (!service.can_tokenize)
    return res.status(403).json({ error: "Not authorized to do this action." });
  try {
    const tokenEntry = await prisma.paymentToken.findUnique({
      where: {
        token: token,
        is_active: true,
      },
      include: {
        card: {
          select: {
            card_holder_name: true,
            last_four_digits: true,
            expiration_date: true,
            type: true,
          },
        },
      },
    });
    if (!tokenEntry)
      return res.status(404).json({ error: "Token not found or inactive." });

    const responseData = {
      card_holder_name: tokenEntry.card.card_holder_name,
      last_four_digits: tokenEntry.card.last_four_digits,
      expiration_date: tokenEntry.card.expiration_date,
      type: tokenEntry.card.type,
    };
    return res.status(200).json({ data: responseData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function fetchPaymentData(req, res) {
  const token = req.body.token;

  if (!token) {
    return res.status(400).json({ error: "Missing token in request body." });
  }

  try {
    const tokenRecord = await prisma.paymentToken.findUnique({
      where: { token: token },
      select: { encrypted_data: true, is_active: true },
    });

    if (!tokenRecord || !tokenRecord.is_active) {
      return res
        .status(404)
        .json({ error: "Token not found or is inactive. " });
    }

    let encryptedBuffer = tokenRecord.encrypted_data;
    if (!(encryptedBuffer instanceof Buffer)) {
      encryptedBuffer = Buffer.from(encryptedBuffer);
    }
    const decryptedJson = encryptionService.decrypt(encryptedBuffer);
    const decryptedData = JSON.parse(decryptedJson);

    res.status(200).json({
      message: "Token succesfully de-tokenized. ",
      decryptedData: decryptedData,
    });
  } catch (error) {
    console.error("[ERROR]: Error during de-tokenization:", error.message);
    res
      .status(500)
      .json({ error: "Failed to decrypt data or internal error." });
  }
}

const toggleTokenStatus = async (req, res) => {
  const { token } = req.body;
  const service = req.service;

  if (!token) return res.status(400).json({ error: "Token is required." });

  try {
    const tokenEntry = await prisma.paymentToken.findFirst({
      where: { token: token, service_id: service.id },
    });

    if (!tokenEntry) return res.status(404).json({ error: "Token not found." });

    const updatedToken = await prisma.paymentToken.update({
      where: {
        id: tokenEntry.id,
      },
      data: {
        is_active: !tokenEntry.is_active,
      },
    });

    res.json({
      msg: `Token ${updatedToken.is_active ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const DeactivateCard = async (req, res) => {
  const body_token = req.body.token;

  const serviceName = req.auth.serviceName;

  const allowedServices = ["dummy_bank", "transaction"];

  if (!serviceName || !allowedServices.includes(serviceName))
    return res.status(403).json({ error: "Not authorized." });

  if (!body_token)
    return res.status(400).json({ error: "Missing token in request body." });

  try {
    const tokenRecord = await prisma.paymentToken.findFirst({
      where: { token: body_token },
      select: { is_active: true },
    });

    if (!tokenRecord || !tokenRecord.is_active) {
      return res.status(404).json({ error: "Token not found or inactive" });
    }

    const updateTokenRecord = await prisma.paymentToken.update({
      where: { token: body_token },
      data: { is_active: false },
    });

    if (!updateTokenRecord)
      return res
        .status(500)
        .json({ error: "Couldn't deactivate the given token." });

    return res.status(200).json({ message: "Successful deactivation" });
  } catch (error) {
    console.log(`[TOKENCONTROLLER]: ${error.message}}`);
    return res
      .status(500)
      .json({ error: "Couldn't deactivate the given token." });
  }
};

const ActivateCard = async (req, res) => {
  const body_token = req.body.token;

  const serviceName = req.auth.serviceName;

  const allowedServices = ["dummy_bank", "transaction"];

  if (!serviceName || !allowedServices.includes(serviceName))
    return res.status(403).json({ error: "Not authorized." });

  if (!body_token)
    return res.status(400).json({ error: "Missing token in request body." });

  try {
    const tokenRecord = await prisma.paymentToken.findFirst({
      where: { token: body_token },
      select: { is_active: true },
    });

    if (!tokenRecord || tokenRecord.is_active) {
      return res
        .status(404)
        .json({ error: "Token not found or is already active" });
    }

    const updateTokenRecord = await prisma.paymentToken.update({
      where: { token: body_token },
      data: { is_active: true },
    });

    if (!updateTokenRecord)
      return res
        .status(500)
        .json({ error: "Couldn't activate the given token." });

    return res.status(200).json({ message: "Successful activation" });
  } catch (error) {
    console.log(`[TOKENCONTROLLER]: ${error.message}}`);
    return res
      .status(500)
      .json({ error: "Couldn't activate the given token." });
  }
};

module.exports = {
  tokenizePaymentData,
  fetchPaymentData,
  DeactivateCard,
  ActivateCard,
  getTokenData,
  toggleTokenStatus,
};
