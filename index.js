require("dotenv").config(); // 1. EZ LEGYEN AZ ELSŐ SOR!

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg"); // Kell a pg Pool az adapterhez
const apiKeyAuth = require("./src/middleware/apiKeyAuth");
const {
  tokenizeLimiter,
  globalLimiter,
  fetchLimiter,
} = require("./src/middleware/rateLimiter");
const {
  tokenizePaymentData,
  fetchPaymentData,
  DeactivateCard,
  ActivateCard,
} = require("./src/api/tokenController");
// Jobb inicializálás az adapterhez
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");

// ... a többi require (tokenizePaymentData, stb.) marad ...

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = "/api/v1";

app.use(express.json());

// ... route-ok maradnak ...

// BIZTONSÁGI ELLENŐRZÉS A CERT-EKRE
const certPath = path.join(__dirname, "certs/cert.pem");
const keyPath = path.join(__dirname, "certs/key.pem");
const protect = apiKeyAuth({ headerName: "x-api-key" });

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Payment Tokenization Service is Running",
    status: "OK",
  });
});

app.post(
  `${API_VERSION}/tokenize`,
  protect,
  tokenizeLimiter,
  tokenizePaymentData,
);

app.post(`${API_VERSION}/fetch-pan`, protect, fetchLimiter, fetchPaymentData);
app.put(`${API_VERSION}/activate`, protect, tokenizeLimiter, ActivateCard);
app.put(`${API_VERSION}/deactivate`, protect, tokenizeLimiter, DeactivateCard);

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 HTTPS Server running on port ${PORT}`);
  });
} else {
  // Ha nincs cert (pl. teszt környezet), induljon el sima HTTP-n,
  // hogy ne omoljon össze a konténer!
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`⚠️ Certs not found! Running on HTTP on port ${PORT}`);
  });
}
