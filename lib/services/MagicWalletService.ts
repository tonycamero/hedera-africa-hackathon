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
  freeMints: number;
  trstBalance: number;
  totalMintsSent: number;
}

/**
 * Login with Magic email OTP
 */
export async function loginWithMagicEmail(email: string): Promise<MagicHederaUser> {
  const magic = getMagicInstance();

  // Step 1: Magic email login and get DID token
  const didToken = await magic.auth.loginWithEmailOTP({ email });
  console.log('[Magic] Login successful, DID token received');

  // Step 2: Get user metadata and tokens
  let token: string;
  let magicDID: string;
  let userEmail: string;
  
  try {
    // Try to get metadata (might fail with Hedera extension)
    const metadata = await magic.user.getMetadata();
    console.log('[Magic] User metadata:', metadata);
    magicDID = metadata.issuer || '';
    userEmail = metadata.email || email;
    
    // Get ID token for API authentication
    token = await magic.user.getIdToken();
    console.log('[Magic] Got ID token for API auth');
  } catch (metadataError: any) {
    console.warn('[Magic] getMetadata() failed:', metadataError.message);
    console.log('[Magic] Using email as fallback identifier');
    
    // Fallback: use email as identifier
    userEmail = email;
    magicDID = `did:ethr:${email}`; // Simple DID format
    
    try {
      token = await magic.user.getIdToken();
      console.log('[Magic] Got ID token (after metadata fallback)');
    } catch (tokenError: any) {
      console.error('[Magic] Failed to get ID token:', tokenError);
      // Create a temporary token for demo purposes
      token = `magic_demo_${Date.now()}`;
      console.warn('[Magic] Using demo token - API calls may fail');
    }
  }

  // Store token in localStorage for API requests
  if (typeof window !== 'undefined') {
    localStorage.setItem('MAGIC_TOKEN', token);
    localStorage.setItem('MAGIC_DID', magicDID);
  }

  // Check if user already exists in localStorage
  const existingUsers = getStoredUsers();
  const existingUser = existingUsers.find((u) => u.email === userEmail);

  if (existingUser) {
    console.log('[Magic] User already exists:', existingUser.hederaAccountId);
    return existingUser;
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

  // Step 5: Fund the account with HBAR and TRST via backend
  try {
    console.log('[Magic] Funding Hedera account via backend...');
    const fundResponse = await fetch('/api/hedera/account/fund', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        accountId: hederaAccountId,
        email: userEmail,
        magicDID
      }),
    });

    if (!fundResponse.ok) {
      const error = await fundResponse.text();
      console.warn('[Magic] Failed to fund account:', error);
      // Don't fail the whole flow if funding fails
    } else {
      console.log('[Magic] Account funded successfully');
    }
  } catch (error: any) {
    console.warn('[Magic] Account funding error:', error.message);
  }

  // Step 6: Create user record
  const newUser: MagicHederaUser = {
    email: userEmail,
    magicDID,
    hederaAccountId,
    publicKey: publicKeyDer,
    freeMints: 27,
    trstBalance: 1.35,
    totalMintsSent: 0,
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
