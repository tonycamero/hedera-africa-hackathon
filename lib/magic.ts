/**
 * Magic SDK Client-Side Initialization
 * 
 * This file initializes the Magic SDK with Hedera extension for client-side signing.
 * The Magic instance is used for:
 * - User authentication (email/SMS)
 * - Getting Hedera public keys
 * - Signing payloads client-side (keys never exposed)
 */

import { Magic } from 'magic-sdk'
import { HederaExtension } from '@magic-ext/hedera'

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined'

// Initialize Magic with Hedera extension (client-side only)
export const magic = isBrowser && process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY
  ? new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY, {
      extensions: {
        hedera: new HederaExtension({
          network: 'testnet', // or 'mainnet'
        }),
      },
    })
  : null

// Type assertion for TypeScript
export type MagicInstance = typeof magic

// Helper to ensure magic is available
export function ensureMagic(): Magic {
  if (!magic) {
    throw new Error('Magic SDK not initialized. Make sure NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is set.')
  }
  return magic as Magic
}
