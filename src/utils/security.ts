/**
 * Security utility for Bring-Your-Own-Key management.
 * - Stores keys safely in localStorage with encryption/obfuscation
 * - Enforces masked display
 * - Strips sensitive secrets from error strings
 */

const STORAGE_KEY = 'aura_dev_keys_vault_v1';
const CIPHER_SALT = 'AURA_DEV_SECURE_STORAGE_KEY_2026';

// Mask a sensitive API key for UI display
export function maskApiKey(key: string | undefined): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  const maskLength = Math.min(24, Math.max(6, trimmed.length - 8));
  return `${prefix}${'•'.repeat(maskLength)}${suffix}`;
}

// Simple reversible obfuscation for client-side storage
// Note: In browser environment, Web Crypto can be used or salted base64 encoding
export function encryptValue(plainText: string): string {
  if (!plainText) return '';
  try {
    const textBytes = new TextEncoder().encode(plainText);
    const saltBytes = new TextEncoder().encode(CIPHER_SALT);
    const xored = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      xored[i] = textBytes[i] ^ saltBytes[i % saltBytes.length];
    }
    let binary = '';
    for (let i = 0; i < xored.byteLength; i++) {
      binary += String.fromCharCode(xored[i]);
    }
    return btoa(binary);
  } catch {
    return btoa(plainText);
  }
}

export function decryptValue(cipherText: string): string {
  if (!cipherText) return '';
  try {
    const binary = atob(cipherText);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const saltBytes = new TextEncoder().encode(CIPHER_SALT);
    const unxored = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      unxored[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
    }
    return new TextDecoder().decode(unxored);
  } catch {
    return '';
  }
}

export interface StoredVault {
  [providerId: string]: {
    encryptedKey: string;
    baseUrl?: string;
    lastTested?: string;
    isConnected: boolean;
  };
}

export function saveKeysToVault(vaultData: Record<string, { apiKey: string; baseUrl?: string; isConnected?: boolean }>): void {
  try {
    const vault: StoredVault = {};
    for (const [providerId, data] of Object.entries(vaultData)) {
      if (data.apiKey) {
        vault[providerId] = {
          encryptedKey: encryptValue(data.apiKey),
          baseUrl: data.baseUrl,
          lastTested: new Date().toISOString(),
          isConnected: !!data.isConnected
        };
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
  } catch (e) {
    // Fail silently without leaking storage error
  }
}

export function loadKeysFromVault(): Record<string, { apiKey: string; baseUrl?: string; isConnected?: boolean }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: StoredVault = JSON.parse(raw);
    const result: Record<string, { apiKey: string; baseUrl?: string; isConnected?: boolean }> = {};
    for (const [providerId, item] of Object.entries(parsed)) {
      if (item && item.encryptedKey) {
        result[providerId] = {
          apiKey: decryptValue(item.encryptedKey),
          baseUrl: item.baseUrl,
          isConnected: item.isConnected
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function clearKeysVault(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// Sanitize any error messages so they NEVER display user API keys
export function sanitizeErrorMessage(errorStr: string, activeKeys: string[] = []): string {
  if (!errorStr) return 'An error occurred';
  let sanitized = errorStr;
  for (const key of activeKeys) {
    if (key && key.length > 5) {
      sanitized = sanitized.split(key).join('[REDACTED_API_KEY]');
    }
  }
  // Strip standard key formats
  sanitized = sanitized.replace(/(sk-[a-zA-Z0-9_-]{10,})/g, 'sk-[REDACTED]');
  sanitized = sanitized.replace(/(AIzaSy[a-zA-Z0-9_-]{20,})/g, 'AIzaSy[REDACTED]');
  sanitized = sanitized.replace(/(gsk_[a-zA-Z0-9_-]{15,})/g, 'gsk_[REDACTED]');
  return sanitized;
}
