const crypto = require("crypto");

// 32-byte encryption key from environment variable (secure!)
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET, 'salt', 32);
const IV_LENGTH = 16; // AES block size for CBC mode

// Encrypt plain text → encrypted string in format: iv:encrypted
exports.encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

// Decrypt encrypted string → original plain text
exports.decrypt = (data) => {
  const [ivHex, encrypted] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
