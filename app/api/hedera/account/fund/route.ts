// app/api/hedera/account/fund/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  Hbar,
  TransferTransaction,
  TokenId,
  AccountId,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';
import { getHederaClient } from '@/lib/hedera/serverClient';
import { Magic } from '@magic-sdk/admin';

const magic = new Magic(process.env.MAGIC_SECRET_KEY!);

// In-memory lock to prevent concurrent funding for same account
const fundingLocks = new Set<string>();

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

    console.log('[API] Funding request for account:', accountId);
    
    // Check if funding already in progress for this account
    if (fundingLocks.has(accountId)) {
      console.log('[API] Funding already in progress for:', accountId);
      return NextResponse.json({
        success: false,
        error: 'Funding already in progress for this account',
        alreadyInProgress: true
      }, { status: 409 });
    }
    
    // Acquire lock
    fundingLocks.add(accountId);
    
    try {
      const client = await getHederaClient();
      const operatorId = client.operatorAccountId!;
      const targetAccountId = AccountId.fromString(accountId);
    
    // Check current balance - if account already has funds, skip stipend
    try {
      const accountInfo = await client.getAccountBalance(targetAccountId);
      const hbarBalance = accountInfo.hbars.toBigNumber().toNumber();
      
      console.log(`[API] Current balance: ${hbarBalance} HBAR`);
      
      // If account has at least 0.9 HBAR, they've already received the stipend
      // (stipend is 1 HBAR, so anything >= 0.9 means they got it)
      if (hbarBalance >= 0.9) {
        console.log('[API] Account already funded - skipping stipend');
        return NextResponse.json({
          success: false,
          error: 'Stipend already claimed for this account',
          alreadyFunded: true
        }, { status: 400 });
      }
    } catch (balanceError) {
      console.error('[API] Failed to check balance:', balanceError);
      // Continue with funding if balance check fails
    }

    // 1. Transfer 1 HBAR for gas
    console.log('[API] Transferring 1 HBAR for gas...');
    await new TransferTransaction()
      .addHbarTransfer(operatorId, new Hbar(-1))
      .addHbarTransfer(targetAccountId, new Hbar(1))
      .execute(client);
    
    console.log('[API] HBAR transfer successful');

    // 2. Associate TRST token + Transfer TRST tokens
    const TRST_TOKEN_ID = process.env.NEXT_PUBLIC_TRST_TOKEN_ID;
    
    if (TRST_TOKEN_ID) {
      try {
        // First, try to associate the token (this requires the user's signature)
        // NOTE: This will fail for Magic accounts since we don't have their private key
        // The proper solution requires Magic to sign the association transaction client-side
        console.log('[API] Attempting TRST token association...');
        
        try {
          // Try operator-paid association (will likely fail - needs user signature)
          const associateTx = await new TokenAssociateTransaction()
            .setAccountId(targetAccountId)
            .setTokenIds([TokenId.fromString(TRST_TOKEN_ID)])
            .execute(client);
          
          await associateTx.getReceipt(client);
          console.log('[API] Token association successful');
        } catch (assocError: any) {
          if (assocError.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
            console.log('[API] Token already associated (OK)');
          } else {
            console.error('[API] Association failed:', assocError.message);
            // Continue anyway - maybe it was already associated
          }
        }
        
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
        
        // If it's a TOKEN_NOT_ASSOCIATED error, explain what's needed
        if (trstError.message?.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
          return NextResponse.json({
            success: true,
            accountId,
            hbarFunded: true,
            trstFunded: false,
            error: 'TRST token association required. This requires user signature via Magic.'
          }, { status: 200 });
        }
        
        return NextResponse.json({
          success: true,
          accountId,
          hbarFunded: true,
          trstFunded: false,
          warning: 'HBAR funded but TRST transfer failed.'
        });
      }
    }

      console.log('[API] Stipend successfully delivered to account:', accountId);
      
      return NextResponse.json({
        success: true,
        accountId,
        hbarFunded: true,
        trstFunded: !!TRST_TOKEN_ID,
        message: '🎁 Welcome stipend delivered! 1 HBAR + 1.35 TRST'
      });
    } finally {
      // Release lock
      fundingLocks.delete(accountId);
    }
  } catch (error: any) {
    console.error('[API] Account funding failed:', error);
    return NextResponse.json(
      { error: error.message || 'Account funding failed' },
      { status: 500 }
    );
  }
}
