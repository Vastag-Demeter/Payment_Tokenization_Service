const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const encryptionService = require("../services/encryptionService");

async function tokenizePaymentData(req, res) {
  const { cardNumber, cvv, expirationDate, userID } = req.body;

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
