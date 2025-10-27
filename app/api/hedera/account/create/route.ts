// app/api/hedera/account/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  AccountCreateTransaction,
  Hbar,
  TransferTransaction,
  TokenId,
  PublicKey,
  TokenAssociateTransaction,
  PrivateKey as HederaPrivateKey,
} from '@hashgraph/sdk';
import { getHederaClient } from '@/lib/hedera/serverClient';

export async function POST(req: NextRequest) {
  try {
    const { email, magicDID, publicKey } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email' },
        { status: 400 }
      );
    }

    console.log('[API] Creating Hedera account for:', email);

    const client = await getHederaClient();
    const operatorId = client.operatorAccountId!;

    let userPublicKey: PublicKey;
    let generatedPrivateKey: string | null = null;

    // If no publicKey provided or invalid, generate a new key pair
    if (!publicKey || publicKey.startsWith('did:') || publicKey.startsWith('0x')) {
      console.log('[API] Generating new ED25519 key pair for account');
      const { PrivateKey } = await import('@hashgraph/sdk');
      const newPrivateKey = PrivateKey.generateED25519();
      userPublicKey = newPrivateKey.publicKey;
      generatedPrivateKey = newPrivateKey.toString();
      console.log('[API] Generated public key:', userPublicKey.toString());
    } else {
      // Parse public key provided by Magic Hedera extension
      userPublicKey = PublicKey.fromString(publicKey);
      console.log('[API] Using Magic-provided public key');
    }

    // 1. Create new Hedera account with 1 HBAR initial balance
    const accountCreateTx = await new AccountCreateTransaction()
      .setKey(userPublicKey)
      .setInitialBalance(new Hbar(1)) // 1 HBAR for gas
      .execute(client);

    const accountCreateReceipt = await accountCreateTx.getReceipt(client);
    const newAccountId = accountCreateReceipt.accountId!.toString();

    console.log('[API] Created account:', newAccountId);

    // 2. Associate and transfer 1.35 TRST to new account
    const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID;
    
    if (!TRST_TOKEN_ID) {
      console.warn('[API] No TRST token ID configured, skipping TRST transfer');
    } else {
      try {
        // Associate token with the new account
        console.log('[API] Associating TRST token with new account...');
        
        if (generatedPrivateKey) {
          // If we generated the key, user signs the association
          const userPrivateKey = HederaPrivateKey.fromStringED25519(generatedPrivateKey);
          const associateTx = await new TokenAssociateTransaction()
            .setAccountId(newAccountId)
            .setTokenIds([TokenId.fromString(TRST_TOKEN_ID)])
            .freezeWith(client)
            .sign(userPrivateKey);
          
          const associateSubmit = await associateTx.execute(client);
          await associateSubmit.getReceipt(client);
        } else {
          // For Magic accounts, operator pays and signs (user can't sign yet)
          // This requires the account to have set up fee delegation, OR
          // we need to have the user sign via Magic later
          // For now, we'll require manual association via /api/hedera/account/fund
          console.log('[API] Magic account - TRST association will be done during first funding');
          // Don't associate yet - we'll do it in the fund endpoint when user can sign via Magic
          return NextResponse.json({
            accountId: newAccountId,
            publicKey: userPublicKey.toStringDer(),
            success: true,
            note: 'TRST association pending - will be done during first funding'
          });
        }
        
        console.log('[API] Token association successful');

        // TRST has 6 decimals, so 1.35 TRST = 1,350,000 smallest units
        const trstAmount = 1_350_000;

        console.log('[API] Transferring TRST...');
        await new TransferTransaction()
          .addTokenTransfer(TRST_TOKEN_ID, operatorId, -trstAmount)
          .addTokenTransfer(TRST_TOKEN_ID, newAccountId, trstAmount)
          .execute(client);

        console.log(`[API] Transferred ${trstAmount / 1_000_000} TRST to ${newAccountId}`);
      } catch (trstError: any) {
        console.error('[API] TRST transfer failed:', trstError.message);
        // Don't fail the whole request if TRST transfer fails
      }
    }

    const response: any = {
      accountId: newAccountId,
      publicKey: userPublicKey.toStringDer(), // Return in DER format for consistency
      success: true,
    };

    // Include private key if we generated it (WARNING: insecure, for demo only)
    if (generatedPrivateKey) {
      response.privateKey = generatedPrivateKey;
      response.warning = 'Private key included - store securely and remove from response in production. This account CANNOT use Magic signing.';
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[API] Account creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Account creation failed' },
      { status: 500 }
    );
  }
}
