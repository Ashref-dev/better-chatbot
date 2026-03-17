import "server-only";

import crypto from "crypto";

const PASSPHRASE = "securitas";
const SALT = "better-chatbot-api-keys";
const ALGORITHM = "aes-256-gcm";

function deriveKey(): Buffer {
  return crypto.pbkdf2Sync(PASSPHRASE, SALT, 100_000, 32, "sha256");
}

export function encrypt(text: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decrypt(data: string): string {
  const key = deriveKey();
  const parts = data.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted data");
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(parts[2], "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
