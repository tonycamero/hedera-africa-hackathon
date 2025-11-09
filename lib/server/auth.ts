/**
 * Server-side auth helpers for Magic token validation
 */

import { Magic } from '@magic-sdk/admin'

const magic = new Magic(process.env.MAGIC_SECRET_KEY!)

export async function requireMagic(req: Request) {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    const err = new Error('Unauthorized')
    ;(err as any).status = 401
    throw err
  }

  const token = authHeader.substring(7)
  
  // Validate Magic DID token and get user metadata
  try {
    await magic.token.validate(token)
    const metadata = await magic.users.getMetadataByToken(token)
    
    return {
      issuer: metadata.issuer,
      email: metadata.email,
      publicAddress: metadata.publicAddress,
      // Extract Hedera account ID from metadata if available
      hederaAccountId: (metadata as any).hederaAccountId
    }
  } catch (error) {
    console.error('[Auth] Magic token validation failed:', error)
    const err = new Error('Invalid or expired token')
    ;(err as any).status = 401
    throw err
  }
}

export function getAccountId(user: any): string {
  // First try Hedera account ID, then fall back to public address
  return user.hederaAccountId || user.publicAddress || 'unknown'
}
