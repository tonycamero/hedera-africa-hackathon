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

    magicInstance = new Magic(apiKey, {
      extensions: [
        new HederaExtension({
          network: 'testnet', // or 'mainnet'
        }),
      ],
    });
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

  // Step 1: Magic email login
  await magic.auth.loginWithEmailOTP({ email });

  // Step 2: Get Magic metadata
  const metadata = await magic.user.getInfo();
  const magicDID = metadata.publicAddress || '';

  // Step 3: Check if user already exists in localStorage
  const existingUsers = getStoredUsers();
  const existingUser = existingUsers.find((u) => u.email === email);

  if (existingUser) {
    console.log('[Magic] User already exists:', existingUser.hederaAccountId);
    return existingUser;
  }

  // Step 4: Get Hedera public key from Magic
  const { publicKeyDer } = await magic.hedera.getPublicKey();

  // Step 5: Create Hedera account via backend
  const response = await fetch('/api/hedera/account/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      magicDID,
      publicKey: publicKeyDer,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Hedera account: ${error}`);
  }

  const { accountId } = await response.json();

  // Step 6: Create user record
  const newUser: MagicHederaUser = {
    email,
    magicDID,
    hederaAccountId: accountId,
    publicKey: publicKeyDer,
    freeMints: 27,
    trstBalance: 1.35,
    totalMintsSent: 0,
  };

  // Step 7: Store user
  storeUser(newUser);

  console.log('[Magic] New user created:', accountId);
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
