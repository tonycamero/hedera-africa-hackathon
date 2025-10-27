// app/api/hedera/account/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  AccountCreateTransaction,
  Hbar,
  TransferTransaction,
  TokenId,
  PublicKey,
} from '@hashgraph/sdk';
import { getHederaClient } from '@/lib/hedera/serverClient';

export async function POST(req: NextRequest) {
  try {
    const { email, magicDID, publicKey } = await req.json();

    if (!email || !publicKey) {
      return NextResponse.json(
        { error: 'Missing email or publicKey' },
        { status: 400 }
      );
    }

    console.log('[API] Creating Hedera account for:', email);

    const client = await getHederaClient();
    const operatorId = client.operatorAccountId!;

    // Parse public key (DER format from Magic)
    const userPublicKey = PublicKey.fromString(publicKey);

    // 1. Create new Hedera account with 1 HBAR initial balance
    const accountCreateTx = await new AccountCreateTransaction()
      .setKey(userPublicKey)
      .setInitialBalance(Hbar.from(1, 'hbar')) // 1 HBAR for gas
      .execute(client);

    const accountCreateReceipt = await accountCreateTx.getReceipt(client);
    const newAccountId = accountCreateReceipt.accountId!.toString();

    console.log('[API] Created account:', newAccountId);

    // 2. Transfer 1.35 TRST to new account
    const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID;
    
    if (!TRST_TOKEN_ID) {
      console.warn('[API] No TRST token ID configured, skipping TRST transfer');
    } else {
      try {
        // TRST has 2 decimals, so 1.35 TRST = 135 smallest units
        const trstAmount = 135;

        await new TransferTransaction()
          .addTokenTransfer(TRST_TOKEN_ID, operatorId, -trstAmount)
          .addTokenTransfer(TRST_TOKEN_ID, newAccountId, trstAmount)
          .execute(client);

        console.log(`[API] Transferred ${trstAmount / 100} TRST to ${newAccountId}`);
      } catch (trstError) {
        console.error('[API] TRST transfer failed:', trstError);
        // Don't fail the whole request if TRST transfer fails
      }
    }

    return NextResponse.json({
      accountId: newAccountId,
      success: true,
    });
  } catch (error: any) {
    console.error('[API] Account creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Account creation failed' },
      { status: 500 }
    );
  }
}
