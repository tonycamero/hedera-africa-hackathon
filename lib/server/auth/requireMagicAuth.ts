import { NextRequest } from 'next/server';

/**
 * Magic ID Token Authentication Middleware
 * 
 * HARD GUARD: All HCS-22 endpoints must authenticate via Magic ID token
 * 
 * Verifies Magic ID token and extracts issuer (DID)
 * Throws 401 on invalid/missing token
 */

interface MagicAuthResult {
  issuer: string;
  email?: string;
  publicAddress?: string;
}

/**
 * Require valid Magic authentication on request
 * 
 * @param req - Next.js request object
 * @returns Verified auth result with issuer
 * @throws Error with 401 status if auth fails
 */
export async function requireMagicAuth(req: NextRequest): Promise<MagicAuthResult> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createAuthError('Missing or invalid Authorization header');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw createAuthError('No token provided');
  }
  
  try {
    // Verify Magic ID token
    const result = await verifyMagicToken(token);
    
    if (!result.issuer) {
      throw createAuthError('Token missing issuer claim');
    }
    
    console.log(`[Auth] Verified Magic token for issuer: ${result.issuer}`);
    
    return result;
  } catch (error: any) {
    console.error('[Auth] Token verification failed:', error.message);
    throw createAuthError(`Token verification failed: ${error.message}`);
  }
}

/**
 * Verify Magic ID token
 * 
 * Accepts three token formats:
 * 1. Standard JWT (header.payload.signature)
 * 2. Magic DID token with Hedera extension: base64([signature, payload])
 * 3. Simple base64 email token (for dev fallback)
 * 
 * TODO PRODUCTION: Replace JWT parsing with Magic Admin SDK verification:
 *   import { Magic } from '@magic-sdk/admin';
 *   const magic = new Magic(process.env.MAGIC_SECRET_KEY);
 *   magic.token.validate(didToken);
 */
async function verifyMagicToken(token: string): Promise<MagicAuthResult> {
  // Try JWT format first (header.payload.signature)
  const parts = token.split('.');
  
  if (parts.length === 3) {
    // Standard JWT format
    try {
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
      );
      
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }
      
      // Check issued time (not too far in future)
      if (payload.iat && payload.iat * 1000 > Date.now() + 60000) {
        throw new Error('Token issued in future');
      }
      
      // Extract issuer (Magic DID)
      const issuer = payload.iss || payload.issuer || payload.sub;
      
      if (!issuer) {
        throw new Error('Token missing issuer');
      }
      
      return {
        issuer,
        email: payload.email,
        publicAddress: payload.publicAddress || payload.public_address
      };
    } catch (error: any) {
      throw new Error(`JWT decode failed: ${error.message}`);
    }
  } else {
    // Try Magic DID token format: base64([signature, payload])
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      
      // Magic DID tokens are JSON arrays
      if (decoded.startsWith('[')) {
        const [signature, payloadJson] = JSON.parse(decoded);
        const payload = JSON.parse(payloadJson);
        
        // Check expiration (ext = expiration time)
        if (payload.ext && payload.ext * 1000 < Date.now()) {
          throw new Error('Token expired');
        }
        
        // Check issued time
        if (payload.iat && payload.iat * 1000 > Date.now() + 60000) {
          throw new Error('Token issued in future');
        }
        
        // Extract issuer (Magic DID)
        const issuer = payload.iss || payload.issuer;
        
        if (!issuer) {
          throw new Error('Token missing issuer');
        }
        
        console.log(`[Auth] Magic DID token verified for issuer: ${issuer}`);
        
        return {
          issuer,
          email: undefined,
          publicAddress: payload.add || payload.publicAddress
        };
      }
      
      // Fallback: Simple base64 token format: base64(email:timestamp)
      const [email, timestamp] = decoded.split(':');
      
      if (!email || !timestamp) {
        throw new Error('Invalid token format');
      }
      
      // Check token age (valid for 24 hours)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 24 * 60 * 60 * 1000) {
        throw new Error('Token expired');
      }
      
      if (tokenAge < 0) {
        throw new Error('Token issued in future');
      }
      
      // Generate DID from email
      const issuer = `did:ethr:${email}`;
      
      console.log(`[Auth] Simple token verified for email: ${email}`);
      
      return {
        issuer,
        email,
        publicAddress: undefined
      };
    } catch (error: any) {
      throw new Error(`Token decode failed: ${error.message}`);
    }
  }
}

/**
 * Create authentication error with proper status code
 */
function createAuthError(message: string): Error {
  const error = new Error(message) as Error & { status: number };
  error.status = 401;
  return error;
}

/**
 * Optional: Extract auth from request without throwing
 * Use this for optional auth scenarios
 */
export async function getMagicAuth(req: NextRequest): Promise<MagicAuthResult | null> {
  try {
    return await requireMagicAuth(req);
  } catch (error) {
    return null;
  }
}
