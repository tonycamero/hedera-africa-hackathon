// lib/services/MagicWalletService.ts
import { Magic } from 'magic-sdk';
import { HederaExtension } from '@magic-ext/hedera';

// Magic.link instance with Hedera extension
let magicInstance: Magic | null = null;

export function getMagicInstance(): Magic {
  if (typeof window === 'undefined') {
    throw new Error('Magic can only be used in browser context');
  }

  if (!magicInstance) {
    const apiKey = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
    if (!apiKey || apiKey === 'pk_test_placeholder') {
      throw new Error('Missing NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY in .env.local');
    }

    console.log('[Magic] Initializing with key:', apiKey.substring(0, 10) + '...');

    // Initialize Magic with Hedera extension
    magicInstance = new Magic(apiKey, {
      extensions: {
        hedera: new HederaExtension({
          network: 'testnet'
        })
      }
    });
    console.log('[Magic] Initialized with Hedera extension for testnet');
  }

  return magicInstance;
}

export interface MagicHederaUser {
  email: string;
  magicDID: string;
  hederaAccountId: string;
  publicKey: string;
  trstBalance: number;
}

const isJwt = (t: string | null | undefined): t is string => {
  return !!t && t.split('.').length === 3;
};

const isMagicDidToken = (t: string | null | undefined): t is string => {
  // Magic DID tokens are base64-encoded arrays: ["signature", "payload"]
  // They start with "WyI" (base64 for '["')
  return !!t && typeof t === 'string' && t.startsWith('WyI');
};

/**
 * Login with Magic email OTP
 */
export async function loginWithMagicEmail(email: string): Promise<MagicHederaUser> {
  const magic = getMagicInstance();

  // Step 1: Magic email login (completes authentication)
  const loginToken = await magic.auth.loginWithEmailOTP({ email });
  console.log('[Magic] Login successful');
  console.log('[Magic] loginToken type:', typeof loginToken);
  console.log('[Magic] loginToken value:', loginToken);

  // Step 2: Get the Magic DID token for authentication
  // With Hedera extension, Magic returns a base64-encoded DID token (not standard JWT)
  let didToken = loginToken as string;
  console.log('[Magic] didToken is standard JWT?', isJwt(didToken));
  console.log('[Magic] didToken is Magic DID token?', isMagicDidToken(didToken));
  
  // If we don't have a valid token, try getIdToken
  if (!isJwt(didToken) && !isMagicDidToken(didToken)) {
    console.log('[Magic] loginToken not recognized, calling getIdToken...');
    try {
      didToken = await magic.user.getIdToken({ lifespan: 300 });
      console.log('[Magic] getIdToken returned:', typeof didToken, didToken ? didToken.substring(0, 50) + '...' : 'null');
    } catch (err) {
      console.error('[Magic] getIdToken failed:', err);
    }
  }
  
  // Accept either JWT or Magic DID token format
  if (!isJwt(didToken) && !isMagicDidToken(didToken)) {
    console.error('[Magic] Final token check failed. Type:', typeof didToken, 'Value:', didToken ? didToken.substring(0, 100) : 'null');
    throw new Error('Magic returned an invalid token format; aborting before API calls.');
  }
  
  // Get Magic user metadata to extract the real issuer (DID)
  const metadata = await magic.user.getInfo();
  const magicDID = metadata.issuer || '';
  const userEmail = email;
  const token = didToken; // verified JWT
  
  if (!magicDID || !magicDID.startsWith('did:ethr:')) {
    throw new Error(`Invalid Magic issuer format: ${magicDID}`);
  }
  
  console.log('[Magic] Using email-based auth:', userEmail);
  console.log('[Magic] Got verified JWT from Magic');
  console.log('[Magic] Token preview:', token.substring(0, 50) + '...');

  // Store token in localStorage for API requests
  if (typeof window !== 'undefined') {
    localStorage.setItem('MAGIC_TOKEN', token);
    localStorage.setItem('MAGIC_DID', magicDID);
  }

  // [HCS-22 Phase 4 T1] NON-BLOCKING identity resolution
  // This populates the HCS audit trail without affecting login flow
  console.log('[HCS22] Pre-check - window:', typeof window, 'magicDID:', magicDID);
  if (typeof window !== 'undefined' && magicDID) {
    console.log('[HCS22] Attempting resolution for:', magicDID);
    
    // Fire-and-forget resolution call (no await)
    fetch('/api/hcs22/resolve', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ magicDID })
    })
    .then(res => res.json())
    .then(data => {
      console.log('[HCS22] Identity resolved:', data);
      if (data.accountId) {
        console.log(`[HCS22] Mapped ${magicDID} → ${data.accountId}`);
      } else {
        console.log(`[HCS22] No existing account for ${magicDID}`);
      }
    })
    .catch(err => console.warn('[HCS22] Resolution failed (non-blocking):', err.message));
  }

  // ALWAYS check HCS-22 for authoritative account binding (localStorage is just a cache)
  // This ensures we recover from cleared browser data or device switches
  console.log('[Magic] Checking HCS-22 for authoritative account binding...');
  try {
    const checkResponse = await fetch('/api/hedera/account/lookup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: userEmail,
        magicDID
      }),
    });

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      if (existing.accountId) {
        console.log('[Magic] Found existing Hedera account:', existing.accountId);
        const restoredUser: MagicHederaUser = {
          email: userEmail,
          magicDID,
          hederaAccountId: existing.accountId,
          publicKey: existing.publicKey || '',
          trstBalance: 1.35,
        };
        storeUser(restoredUser);
        return restoredUser;
      }
    }
  } catch (error) {
    console.warn('[Magic] Backend lookup failed, will create new account:', error);
  }

  // Step 4: Get Magic Hedera public key (doesn't create account automatically)
  let hederaAccountId: string;
  let publicKeyDer: string;
  
  try {
    console.log('[Magic] Getting Hedera public key from Magic wallet...');
    // IMPORTANT: magic.hedera.getPublicKey() only returns the key, doesn't create account
    const keyData = await magic.hedera.getPublicKey();
    publicKeyDer = keyData.publicKeyDer;
    
    console.log('[Magic] Got public key from Magic:', publicKeyDer);
    
    // Check if keyData has accountId (it shouldn't per the docs)
    if (keyData.accountId) {
      console.log('[Magic] Unexpected: Magic returned accountId:', keyData.accountId);
      hederaAccountId = keyData.accountId;
    } else {
      console.log('[Magic] No accountId returned (expected). Creating account via backend...');
      
      // Create the Hedera account using the Magic public key
      const createResponse = await fetch('/api/hedera/account/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          magicDID,
          publicKey: publicKeyDer  // Use Magic's public key
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Account creation failed: ${error}`);
      }

      const { accountId } = await createResponse.json();
      hederaAccountId = accountId;
      console.log('[Magic] Created Hedera account with Magic key:', hederaAccountId);
    }
  } catch (error: any) {
    console.error('[Magic] Failed to setup Hedera account:');
    console.error('[Magic] Error:', error);
    throw new Error(`Failed to setup Hedera account: ${error.message}`);
  }

  // Step 5: Skip automatic funding - user will accept stipend during onboarding
  // This requires user signature to associate TRST token
  console.log('[Magic] Account created - user will accept stipend during onboarding');

  // Step 6: Create user record
  const newUser: MagicHederaUser = {
    email: userEmail,
    magicDID,
    hederaAccountId,
    publicKey: publicKeyDer,
    trstBalance: 1.35,
  };

  // Step 7: Store user
  storeUser(newUser);

  console.log('[Magic] New user created with Magic Hedera account:', hederaAccountId);
  return newUser;
}

/**
 * Get current logged-in user
 */
export async function getCurrentMagicUser(): Promise<MagicHederaUser | null> {
  if (typeof window === 'undefined') return null;

  try {
    const magic = getMagicInstance();
    const isLoggedIn = await magic.user.isLoggedIn();

    if (!isLoggedIn) return null;

    const metadata = await magic.user.getInfo();
    const email = metadata.email || '';

    // Lookup in localStorage
    const users = getStoredUsers();
    const user = users.find((u) => u.email === email);

    return user || null;
  } catch (error) {
    console.error('[Magic] Failed to get current user:', error);
    return null;
  }
}

/**
 * Logout
 */
export async function logoutMagic(): Promise<void> {
  const magic = getMagicInstance();
  await magic.user.logout();
  console.log('[Magic] User logged out');
}

/**
 * Get Magic Hedera signer for transactions
 */
export async function getMagicHederaSigner() {
  const magic = getMagicInstance();
  const { publicKeyDer, accountId } = await magic.hedera.getPublicKey();

  return {
    accountId,
    publicKey: publicKeyDer,
    sign: async (message: Uint8Array) => {
      return magic.hedera.sign(message);
    },
  };
}

// LocalStorage helpers (for demo; replace with DB in production)
const USERS_KEY = 'tm:users';

function getStoredUsers(): MagicHederaUser[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function storeUser(user: MagicHederaUser): void {
  const users = getStoredUsers();
  const updated = [...users.filter((u) => u.email !== user.email), user];
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
}

export function getAllUsers(): MagicHederaUser[] {
  return getStoredUsers();
}

export function updateUser(email: string, updates: Partial<MagicHederaUser>): void {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.email === email);
  if (index >= 0) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}
