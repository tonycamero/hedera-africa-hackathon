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
import { publishHcs22 } from '@/lib/server/hcs22/publish';
import { bindEvent } from '@/lib/server/hcs22/types';

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

    // 1. Create new Hedera account with 0 balance - user will fund via stipend acceptance
    // Note: Minimum balance for account creation is 0 (account remains dormant until funded)
    const accountCreateTx = await new AccountCreateTransaction()
      .setKey(userPublicKey)
      .setInitialBalance(new Hbar(0)) // No initial balance - funded via stipend
      .setMaxAutomaticTokenAssociations(10) // Enable auto-association for first 10 tokens
      .execute(client);

    const accountCreateReceipt = await accountCreateTx.getReceipt(client);
    const newAccountId = accountCreateReceipt.accountId!.toString();

    console.log('[API] Created account with 0 balance:', newAccountId);
    console.log('[API] Account will be funded when user accepts stipend');

    // Publish IDENTITY_BIND to HCS-22 for durable persistence
    if (magicDID) {
      try {
        const evmAddress = magicDID.replace('did:ethr:', '');
        await publishHcs22(bindEvent({
          issuer: magicDID,
          hederaId: newAccountId,
          evmAddress,
          emailHash: email ? Buffer.from(email).toString('base64') : undefined,
        }));
        console.log('[API] Published IDENTITY_BIND to HCS-22:', magicDID, '→', newAccountId);
      } catch (bindError) {
        console.error('[API] Failed to publish IDENTITY_BIND (non-blocking):', bindError);
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
