import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Standard AES-256-GCM configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

let transientKey: Buffer | null = null;

/**
 * Get or generate the encryption key.
 * In production, it MUST be in the .env as a 64-character hex string.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    if (!transientKey) {
      console.warn('⚠️ [Security] ENCRYPTION_SECRET missing in .env. Generating a transient key for this session...');
      transientKey = crypto.randomBytes(32);
    }
    return transientKey;
  }
  
  // If provided as hex string, use it. Otherwise hash it.
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plain text string using AES-256-GCM.
 */
export function encrypt(text: string): { iv: string; content: string; tag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag().toString('hex');
  
  return {
    iv: iv.toString('hex'),
    content: encrypted,
    tag: tag
  };
}

/**
 * Decrypt an encrypted payload. 
 * Throws if the tag is invalid (integrity check).
 */
export function decrypt(data: { iv: string; content: string; tag: string }): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(data.iv, 'hex');
  const tag = Buffer.from(data.tag, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(data.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a cryptographically secure random session ID.
 */
export function generateSecureSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}
