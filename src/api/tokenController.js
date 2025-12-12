const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const encryptionService = require("../services/encryptionService");

function detectCardType(cardNumber) {
  const cleaned = cardNumber.replace(/\D/g, "");

  if (/^4\d{12,18}$/.test(cleaned)) return "VISA";
  if (/^5[1-5]\d{14}$/.test(cleaned)) return "MASTERCARD";
  if (/^3[47]\d{13}$/.test(cleaned)) return "AMEX";
  if (/^(6011|65|64[4-9])\d{12,15}$/.test(cleaned)) return "DISCOVER";
  if (/^35(2[89]|[3-8]\d)\d{12}$/.test(cleaned)) return "JCB";
  if (/^62\d{14,17}$/.test(cleaned)) return "UNIONPAY";

  return "UNKNOWN";
}

async function tokenizePaymentData(req, res) {
  const cardNumber = req.body.cardNumber;
  const expirationDate = req.body.expirationDate;
  const userID = req.body.userID;
  if (!cardNumber || !expirationDate || !userID) {
    return res
      .status(400)
      .json({ error: "Missing required payment data or User ID." });
  }

  try {
    const token = encryptionService.generateToken();
    const cardType = detectCardType(cardNumber);
    const sensitiveDataJson = JSON.stringify({
      cardNumber,
      expirationDate,
      card_type: cardType,
      userID,
    });
    const encryptedPayLoad = encryptionService.encrypt(sensitiveDataJson);
    const savedRecord = await prisma.paymentToken.create({
      data: {
        token: token,
        encrypted_data: encryptedPayLoad,
        user_id: userID,
        last_four_digits: cardNumber.slice(-4),
        expiration_date: expirationDate,
        is_active: true,
      },
      select: {
        token: true,
        last_four_digits: true,
        expiration_date: true,
      },
    });

    res.status(201).json({
      message: "Payment data succesfully tokenized.",
      tokenData: savedRecord,
      type: cardType,
    });
  } catch (error) {
    console.error("[ERROR]: Error during tokenization: ", error.message);
    res.status(500).json({ error: "Failed to process tokenization request. " });
  }
}

async function fetchPaymentData(req, res) {
  const serviceName = req.auth.serviceName;
  const allowedServices = ["dummy_bank", "transaction"];

  if (
    !serviceName ||
    !allowedServices.includes(serviceName.trim().toLowerCase())
  ) {
    return res.status(403).json({ error: "Not authorized." });
  }
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
};
