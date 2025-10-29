/**
 * Server-side auth helpers for Magic token validation
 * 
 * TODO: Implement full Magic DID token validation
 * when Magic backend SDK is integrated
 */

export async function requireMagic(req: Request) {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    const err = new Error('Unauthorized')
    ;(err as any).status = 401
    throw err
  }

  const token = authHeader.substring(7)
  
  // TODO: Validate Magic DID token
  // const magic = new Magic(process.env.MAGIC_SECRET_KEY)
  // const metadata = await magic.users.getMetadataByToken(token)
  
  // Mock user for now
  return {
    issuer: 'mock-issuer',
    email: 'mock@example.com',
    publicAddress: '0x1234...5678'
  }
}

export function getAccountId(user: any): string {
  // TODO: Extract Hedera account ID from Magic user metadata
  // For now, use mock or extract from localStorage pattern
  return user.publicAddress || 'tm-mock-account'
}
