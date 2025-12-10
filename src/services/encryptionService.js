const crypto = require("crypto");

const IV_LENGTH = 16;
const ALGORITHM = "aes-256-gcm";
const KEY = process.env.ENCRYPTION_KEY;

if (!KEY || Buffer.byteLength(KEY, "hex") !== 32) {
  throw new Error(
    "[CRITICAL_ERROR]: Encryption key must be exactly 32 bytes (64 HEX characters)! Check your .env file."
  );
}

function generateToken(data) {
  return crypto.randomBytes(16).toString("hex");
}

function encrypt(data) {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY, "hex"), iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, Buffer.from(encrypted, "hex")]);
}

function decrypt(fullEncryptedPayload) {
  const iv = fullEncryptedPayload.subarray(0, IV_LENGTH);
  const tag = fullEncryptedPayload.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encryptedDataBuffer = fullEncryptedPayload.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(KEY, "hex"),
    iv
  );
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(
    encryptedDataBuffer.toString("hex"),
    "hex",
    "utf8"
  );
  decrypted += decipher.final("utf-8");

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
  generateToken,
};
