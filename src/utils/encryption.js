import crypto from "crypto";

export function getPasswordKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
}

export function wrapFileKey(fileKey, password, salt, iv) {
  const passwordKey = getPasswordKey(password, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", passwordKey, iv);
  const encrypted = Buffer.concat([cipher.update(fileKey), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([encrypted, tag]);
}

export function unwrapFileKey(password, wrappedKey, salt, iv) {
  const wrappedBuffer = Buffer.from(wrappedKey, "base64");
  const saltBuffer = Buffer.from(salt, "base64");
  const ivBuffer = Buffer.from(iv, "base64");

  const tag = wrappedBuffer.slice(-16);
  const encrypted = wrappedBuffer.slice(0, -16);
  const passwordKey = getPasswordKey(password, saltBuffer);

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    passwordKey,
    ivBuffer
  );
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function encryptFileBuffer(buffer, key) {
  console.log("Key length:", key.length);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, tag]);
}

export function decryptFileBuffer(encryptedBuffer, key) {
  const iv = encryptedBuffer.slice(0, 12);
  const tag = encryptedBuffer.slice(-16);
  const encrypted = encryptedBuffer.slice(12, -16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// https://medium.com/%40tony.infisical/guide-to-nodes-crypto-module-for-encryption-decryption-65c077176980
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/unwrapKey
