const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

require("dotenv").config();
const express = require("express");
const {
  tokenizePaymentData,
  fetchPaymentData,
  ActivateCard,
  DeactivateCard,
} = require("./src/api/tokenController");
const apiKeyAuth = require("./src/middleware/apiKeyAuth");
const {
  globalLimiter,
  fetchLimiter,
  tokenizeLimiter,
} = require("./src/middleware/rateLimiter");

const fs = require("fs");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = "/api/v1";

app.use(express.json());
app.use(globalLimiter);

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
  tokenizePaymentData
);

app.post(`${API_VERSION}/fetch-pan`, protect, fetchLimiter, fetchPaymentData);
app.put(`${API_VERSION}/activate`, protect, tokenizeLimiter, ActivateCard);
app.put(`${API_VERSION}/deactivate`, protect, tokenizeLimiter, DeactivateCard);

const options = {
  key: fs.readFileSync("certs/key.pem"),
  cert: fs.readFileSync("certs/cert.pem"),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`Tokenization Service listening on port ${PORT}`);
  console.log(`======================================================`);
});
