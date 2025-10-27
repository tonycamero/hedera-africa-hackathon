// app/api/hedera/account/fund/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  Hbar,
  TransferTransaction,
  TokenId,
  AccountId,
} from '@hashgraph/sdk';
import { getHederaClient } from '@/lib/hedera/serverClient';
import { Magic } from '@magic-sdk/admin';

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
    
    const { accountId, email, magicDID } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 }
      );
    }

    console.log('[API] Funding Hedera account:', accountId);

    const client = await getHederaClient();
    const operatorId = client.operatorAccountId!;
    const targetAccountId = AccountId.fromString(accountId);

    // 1. Transfer 1 HBAR for gas
    console.log('[API] Transferring 1 HBAR for gas...');
    await new TransferTransaction()
      .addHbarTransfer(operatorId, new Hbar(-1))
      .addHbarTransfer(targetAccountId, new Hbar(1))
      .execute(client);
    
    console.log('[API] HBAR transfer successful');

    // 2. Transfer TRST tokens if configured
    const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID;
    
    if (TRST_TOKEN_ID) {
      try {
        // TRST has 6 decimals, so 1.35 TRST = 1,350,000 smallest units
        const trstAmount = 1_350_000;

        console.log('[API] Transferring TRST tokens...');
        await new TransferTransaction()
          .addTokenTransfer(TRST_TOKEN_ID, operatorId, -trstAmount)
          .addTokenTransfer(TRST_TOKEN_ID, targetAccountId, trstAmount)
          .execute(client);

        console.log(`[API] Transferred ${trstAmount / 1_000_000} TRST to ${accountId}`);
      } catch (trstError: any) {
        console.error('[API] TRST transfer failed:', trstError.message);
        // Note: Magic-created accounts should already have token association
        // If this fails, the account might need to associate the token first
        return NextResponse.json({
          success: true,
          accountId,
          hbarFunded: true,
          trstFunded: false,
          warning: 'HBAR funded but TRST transfer failed. Account may need token association.'
        });
      }
    }

    return NextResponse.json({
      success: true,
      accountId,
      hbarFunded: true,
      trstFunded: !!TRST_TOKEN_ID
    });
  } catch (error: any) {
    console.error('[API] Account funding failed:', error);
    return NextResponse.json(
      { error: error.message || 'Account funding failed' },
      { status: 500 }
    );
  }
}
