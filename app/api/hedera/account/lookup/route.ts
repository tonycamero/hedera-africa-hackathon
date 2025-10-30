// app/api/hedera/account/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Magic } from '@magic-sdk/admin';
import { resolveHederaAccountId } from '@/lib/server/hcs22/resolver';

const magic = new Magic(process.env.MAGIC_SECRET_KEY!);

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

    if (!email && !magicDID) {
      return NextResponse.json(
        { error: 'Missing email or magicDID' },
        { status: 400 }
      );
    }

    // Use magicDID if provided, otherwise construct from email
    const issuer = magicDID || `did:ethr:${email}`;
    
    console.log('[API /hedera/account/lookup] Looking up account for issuer:', issuer);
    
    // Query HCS-22 reducer (reads from HCS topic state)
    const accountId = await resolveHederaAccountId(issuer);
    
    if (accountId) {
      console.log('[API /hedera/account/lookup] Found existing account:', accountId);
      return NextResponse.json({
        found: true,
        accountId,
        magicDID: issuer
      });
    }

    console.log('[API /hedera/account/lookup] No existing account found for:', issuer);
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
