const crypto = require('crypto');

// Ensure that ENCRYPTION_SECRET is set in your environment variables
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET, 'salt', 32); // 32-byte key for AES-256
const IV_LENGTH = 16; // AES block size for IV

// Encrypt function
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV for each encryption
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return the IV + encrypted message (combined into a string, separated by ':')
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt function
function decrypt(text) {
  const [ivHex, encrypted] = text.split(':'); // Split IV and encrypted message
  const iv = Buffer.from(ivHex, 'hex'); // Convert IV from hex to Buffer
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { encrypt, decrypt };
