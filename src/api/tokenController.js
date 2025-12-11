const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const encryptionService = require("../services/encryptionService");
async function tokenizePaymentData(req, res) {
  //   const { cardNumber, cvv, expirationDate, userID } = req.body;
  const cardNumber = req.body.cardNumber;
  const cvv = req.body.cvv;
  const expirationDate = req.body.expirationDate;
  const userID = req.body.userID;
  if (!cardNumber || !cvv || !expirationDate || !userID) {
    return res
      .status(400)
      .json({ error: "Missing required payment data or User ID." });
  }

  try {
    const token = encryptionService.generateToken();
    const sensitiveDataJson = JSON.stringify({ cardNumber, cvv });
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
    });
  } catch (error) {
    console.error("[ERROR]: Error during tokenization: ", error.message);
    res.status(500).json({ error: "Failed to process tokenization request. " });
  }
}

async function fetchPaymentData(req, res) {
  const { token } = req.body;

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

    const decryptedJson = encryptionService.decrypt(tokenRecord.encrypted_data);
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

module.exports = {
  tokenizePaymentData,
  fetchPaymentData,
};
