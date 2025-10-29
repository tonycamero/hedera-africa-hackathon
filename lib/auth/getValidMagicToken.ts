import { getMagicInstance } from '@/lib/services/MagicWalletService';

const isJwt = (t?: string | null): t is string => {
  return !!t && t.split('.').length === 3;
};

const isMagicDidToken = (t?: string | null): t is string => {
  // Magic DID tokens with Hedera extension are base64-encoded arrays
  return !!t && typeof t === 'string' && t.startsWith('WyI');
};

const isValidToken = (t?: string | null): t is string => {
  return isJwt(t) || isMagicDidToken(t);
};

/**
 * Get a valid Magic JWT token
 * 
 * Prefers a fresh short-lived token from Magic.user.getIdToken()
 * Falls back to localStorage if that fails
 * 
 * @throws Error if no valid JWT is available
 */
export async function getValidMagicToken(): Promise<string> {
  const magic = getMagicInstance();

  // Prefer a brand-new short-lived token
  try {
    const fresh = await magic.user.getIdToken({ lifespan: 300 });
    if (isValidToken(fresh)) {
      console.log('[getValidMagicToken] Got fresh token from Magic');
      return fresh;
    }
  } catch (err) {
    console.warn('[getValidMagicToken] Failed to get fresh token:', err);
  }

  // Fallback: use what login stored
  const stored = typeof window !== 'undefined' ? localStorage.getItem('MAGIC_TOKEN') : null;
  if (isValidToken(stored)) {
    console.log('[getValidMagicToken] Using stored token from localStorage');
    return stored;
  }

  throw new Error('No valid Magic token available');
}
