// HCS-22 Account Provisioning - Creates Hedera account via dust transfer to EVM alias
import { Client, TransferTransaction, Hbar, AccountId, PrivateKey } from '@hashgraph/sdk';
import { lookupAccountByEvm } from './mirror';
import { publishHcs22Async } from './publish';
import { bindEvent } from './types';
import * as crypto from 'crypto';

/**
 * Provision a Hedera account for an EVM address and publish BIND event
 * 
 * Uses "auto-create" pattern: sends 1 tinybar to the EVM alias address,
 * which triggers Hedera to automatically create the account.
 * 
 * Idempotent: Returns existing account if already created.
 */
export async function provisionAndBind(args: {
  evmAddress: string;
  issuer: string;
  emailHash?: string;
}): Promise<{ accountId: string; txId: string; wasCreated: boolean }> {
  const evm = args.evmAddress.toLowerCase();
  
  // Check if account already exists (idempotency)
  console.log(`[HCS22 Provision] Checking if account exists for EVM ${evm}`);
  const existing = await lookupAccountByEvm(evm);
  
  if (existing) {
    console.log(`[HCS22 Provision] Account already exists: ${existing}`);
    return { accountId: existing, txId: '', wasCreated: false };
  }

  // Initialize Hedera client
  const network = (process.env.HEDERA_NETWORK ?? 'testnet').trim();
  const client = Client.forName(network);
  
  const operatorIdStr = process.env.HEDERA_OPERATOR_ID;
  const operatorKeyStr = process.env.HEDERA_OPERATOR_KEY;
  
  if (!operatorIdStr || !operatorKeyStr) {
    throw new Error('Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY');
  }
  
  const operatorId = AccountId.fromString(operatorIdStr);
  
  // Handle different key formats
  let operatorKey: PrivateKey;
  if (operatorKeyStr.startsWith('0x')) {
    operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr.slice(2));
  } else if (operatorKeyStr.length > 64) {
    operatorKey = PrivateKey.fromStringDer(operatorKeyStr);
  } else {
    operatorKey = PrivateKey.fromString(operatorKeyStr);
  }
  
  client.setOperator(operatorId, operatorKey);

  // Create account via dust transfer to EVM alias
  console.log(`[HCS22 Provision] Creating account for EVM ${evm} via dust transfer`);
  
  const aliasId = AccountId.fromEvmAddress(0, 0, evm);
  
  const tx = await new TransferTransaction()
    .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
    .addHbarTransfer(aliasId, Hbar.fromTinybars(1))
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const txId = tx.transactionId.toString();
  
  console.log(`[HCS22 Provision] Dust transfer complete: ${txId}`);

  // Poll Mirror Node to confirm account creation (up to 5 seconds)
  let accountId: string | null = null;
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 500));
    accountId = await lookupAccountByEvm(evm);
    if (accountId) {
      console.log(`[HCS22 Provision] Account confirmed: ${accountId}`);
      break;
    }
  }

  if (!accountId) {
    throw new Error(`[HCS22 Provision] Timeout waiting for account creation (txId: ${txId})`);
  }

  // Publish BIND event (non-blocking, fire-and-forget)
  console.log(`[HCS22 Provision] Publishing BIND event for ${args.issuer} → ${accountId}`);
  publishHcs22Async(bindEvent({
    issuer: args.issuer,
    hederaId: accountId,
    evmAddress: evm,
    createTxId: txId,
    emailHash: args.emailHash,
  }));

  return { accountId, txId, wasCreated: true };
}
