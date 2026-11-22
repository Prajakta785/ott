import crypto from 'crypto';

/**
 * Master Encryption Key for OTT Video URLs & Storage Identifiers.
 * Derived from environment variable or Bunny Token Security Key.
 */
const MASTER_SECRET = 
  process.env.OTT_MASTER_ENCRYPTION_KEY || 
  process.env.BUNNY_TOKEN_SECURITY_KEY || 
  process.env.BUNNY_TOKEN_AUTH_KEY || 
  'af71bff6-aa4a-4222-a99e-9589d3bed97c';

/**
 * Derive a 256-bit (32-byte) cryptographic key from the secret
 */
function deriveKey(secret: string = MASTER_SECRET): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a raw video URL, Bunny GUID, or storage path using AES-256-GCM.
 * Output format: enc_v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptVideoUrl(plainText: string, secret: string = MASTER_SECRET): string {
  if (!plainText) return '';
  // If already encrypted, do not double-encrypt
  if (plainText.startsWith('enc_v1:')) return plainText;

  try {
    const key = deriveKey(secret);
    const iv = crypto.randomBytes(12); // 96-bit standard IV for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return `enc_v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Video URL encryption error:', err);
    return plainText;
  }
}

/**
 * Decrypt an AES-256-GCM encrypted video token.
 * If input is not encrypted (e.g. legacy plain GUID or URL), returns as-is safely.
 */
export function decryptVideoUrl(encryptedStr: string, secret: string = MASTER_SECRET): string {
  if (!encryptedStr) return '';
  if (!encryptedStr.startsWith('enc_v1:')) return encryptedStr;

  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 4) return encryptedStr;

    const [, ivHex, tagHex, cipherHex] = parts;
    const key = deriveKey(secret);
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Video URL decryption error:', err);
    return encryptedStr;
  }
}

/**
 * Check if a given string is an encrypted video URL / token
 */
export function isEncryptedUrl(str?: string): boolean {
  if (!str) return false;
  return str.startsWith('enc_v1:');
}

/**
 * Client-safe WebCrypto implementation for browser environments
 */
export async function clientDecryptVideoUrl(encryptedStr: string, secret: string = 'af71bff6-aa4a-4222-a99e-9589d3bed97c'): Promise<string> {
  if (!encryptedStr || !encryptedStr.startsWith('enc_v1:')) return encryptedStr;

  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 4) return encryptedStr;

    const [, ivHex, tagHex, cipherHex] = parts;

    // Convert hex to Uint8Array
    const hexToBytes = (hex: string) => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    };

    const ivBytes = hexToBytes(ivHex);
    const tagBytes = hexToBytes(tagHex);
    const cipherBytes = hexToBytes(cipherHex);

    // WebCrypto AES-GCM expects ciphertext concatenated with the 16-byte tag
    const combinedCipher = new Uint8Array(cipherBytes.length + tagBytes.length);
    combinedCipher.set(cipherBytes, 0);
    combinedCipher.set(tagBytes, cipherBytes.length);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      cryptoKey,
      combinedCipher
    );

    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn('Client WebCrypto decrypt error, returning raw:', err);
    return encryptedStr;
  }
}
