// app/api/hedera/account/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Magic } from '@magic-sdk/admin';

const magic = new Magic(process.env.MAGIC_SECRET_KEY!);

// In-memory store for demo (replace with database in production)
// Maps email -> Hedera Account ID
const emailToAccountMap = new Map<string, { accountId: string; publicKey: string; magicDID: string }>();

export async function POST(req: NextRequest) {
  try {
    // Verify Magic DID token
    const auth = req.headers.get('Authorization') || '';
    const didToken = auth.replace(/^Bearer\s+/i, '');
    if (!didToken) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    
    await magic.token.validate(didToken);
    
    const { email, magicDID } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email' },
        { status: 400 }
      );
    }

    console.log('[API /hedera/account/lookup] Looking up account for email:', email);
    
    // Check in-memory map
    const existing = emailToAccountMap.get(email);
    
    if (existing) {
      console.log('[API /hedera/account/lookup] Found existing account:', existing.accountId);
      return NextResponse.json({
        found: true,
        accountId: existing.accountId,
        publicKey: existing.publicKey,
        magicDID: existing.magicDID
      });
    }

    console.log('[API /hedera/account/lookup] No existing account found for:', email);
    return NextResponse.json({
      found: false
    });

  } catch (error: any) {
    console.error('[API /hedera/account/lookup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to lookup account' },
      { status: 500 }
    );
  }
}

// Helper function to register an account (called from create endpoint)
export function registerAccount(email: string, accountId: string, publicKey: string, magicDID: string) {
  emailToAccountMap.set(email, { accountId, publicKey, magicDID });
  console.log('[Account Registry] Registered:', email, '→', accountId);
}

// Export the map for use by create endpoint
export { emailToAccountMap };
