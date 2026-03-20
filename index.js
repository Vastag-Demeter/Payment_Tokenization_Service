require("dotenv").config(); // 1. EZ LEGYEN AZ ELSŐ SOR!

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg"); // Kell a pg Pool az adapterhez
const cors = require("cors");
const {
  apiKeyAuth,
  authCanFetch,
  authCanManage,
  authCanTokenize,
} = require("./src/middleware/apiKeyAuth");
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
  getTokenData,
  toggleTokenStatus,
} = require("./src/api/tokenController");

const {
  getServices,
  getServiceById,
  addService,
  updateService,
  changeServiceActiveness,
} = require("./src/api/serviceController");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");

const app = express();
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // OPTIONS hozzáadva
  allowedHeaders: ["Content-Type", "x-api-key"],
  optionsSuccessStatus: 200, // Fontos a Preflight sikeréhez
};

app.use(cors(corsOptions));

app.options(/(.*)/, cors(corsOptions));
const PORT = process.env.PORT || 3000;

app.use(express.json());

const certPath = path.join(__dirname, "certs/cert.pem");
const keyPath = path.join(__dirname, "certs/key.pem");
const protect = apiKeyAuth({ headerName: "x-api-key" });

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Payment Tokenization Service is Running",
    status: "OK",
  });
});

//Tokenization functions
app.post(
  `/tokenize`,
  protect,
  tokenizeLimiter,
  authCanTokenize,
  tokenizePaymentData,
);
app.get(`/fetch`, protect, fetchLimiter, authCanFetch, fetchPaymentData);
app.put(`/activate`, protect, tokenizeLimiter, ActivateCard);
app.put(`/deactivate`, protect, tokenizeLimiter, DeactivateCard);
app.get("/getTokenData", protect, authCanTokenize, getTokenData);
app.put("/toggleTokenStatus", protect, authCanTokenize, toggleTokenStatus);

//Service functions
app.get("/getServices", protect, authCanManage, getServices);
app.get("/getServiceById", protect, authCanManage, getServiceById);
app.post("/addService", protect, authCanManage, addService);
app.put("/updateService", protect, authCanManage, updateService);
app.put(
  "/changeServiceActiveness",
  protect,
  authCanManage,
  changeServiceActiveness,
);

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
    console.log(`HTTPS Server running on port ${PORT}`);
  });
} else {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Certs not found! Running on HTTP on port ${PORT}`);
  });
}
