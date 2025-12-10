require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");

const {
  tokenizePaymentData,
  fetchPaymentData,
} = require("./src/api/tokenController");
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = "/api/v1";

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.status.json({
    message: "Payment Tokenization Service is Running",
    status: "OK",
  });
});

app.post(`${API_VERSION}/tokenize`, tokenizePaymentData);

app.post(`${API_VERSION}/fetch-pan`, fetchPaymentData);

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Tokenization Service listening on port ${PORT}`);
  console.log(
    `Encryption Key Status: ${
      process.env.ENCRYPTION_KEY ? "Loaded" : "MISSING"
    }`
  );
  console.log(`======================================================`);
});
