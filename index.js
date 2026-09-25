import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import cors from "cors";

import express from "express";

import {
  apiKeyAuth,
  authCanFetch,
  authCanManage,
  authCanTokenize,
} from "./src/middleware/apiKeyAuth.js";

import {
  tokenizeLimiter,
  globalLimiter,
  fetchLimiter,
} from "./src/middleware/rateLimiter.js";

import {
  tokenizePaymentData,
  fetchPaymentData,
  DeactivateCard,
  ActivateCard,
  getTokenData,
  toggleTokenStatus,
} from "./src/api/tokenController.js";

import {
  getServices,
  getServiceById,
  addService,
  updateService,
  changeServiceActiveness,
} from "./src/api/serviceController.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "*"
      : "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-api-key"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

const PORT = process.env.PORT || 10000;

app.use(express.json());
const protect = apiKeyAuth({ headerName: "x-api-key" });

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Payment Tokenization Service is Running",
    status: "OK",
  });
});

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

app.listen(PORT, "0.0.0.0", () => {
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log(`Server running on port ${PORT}`);
});
