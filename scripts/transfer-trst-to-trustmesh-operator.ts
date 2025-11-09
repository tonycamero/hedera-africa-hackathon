#!/usr/bin/env tsx
// Transfer TRST from Culture Wallet operator to TrustMesh operator

import {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  TokenId,
} from '@hashgraph/sdk';

// Culture Wallet operator (source - has TRST)
const CULTURE_WALLET_OPERATOR_ID = '0.0.5864857';
const CULTURE_WALLET_OPERATOR_KEY = '3030020100300706052b8104000a04220420f74a89b2b666997fcf3cada43ac37cd9c27991874e72b4883682590dc3caf25a';

// TrustMesh operator (destination - needs TRST)
const TRUSTMESH_OPERATOR_ID = '0.0.5864559';

// TRST token
const TRST_TOKEN_ID = '0.0.5361653';

// Amount to transfer (in smallest units, TRST has 6 decimals)
// Transfer 10,000 TRST = 10,000,000,000 smallest units
const AMOUNT_TO_TRANSFER = 10_000_000_000; // 10,000 TRST

async function transferTrst() {
  console.log('🚀 Starting TRST transfer...\n');

  // Setup client with Culture Wallet operator
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(CULTURE_WALLET_OPERATOR_ID),
    PrivateKey.fromStringECDSA(CULTURE_WALLET_OPERATOR_KEY)
  );

  console.log('📊 Transfer Details:');
  console.log(`  From: ${CULTURE_WALLET_OPERATOR_ID} (Culture Wallet)`);
  console.log(`  To: ${TRUSTMESH_OPERATOR_ID} (TrustMesh)`);
  console.log(`  Amount: ${AMOUNT_TO_TRANSFER / 1_000_000} TRST`);
  console.log(`  Token: ${TRST_TOKEN_ID}\n`);

  try {
    // Create transfer transaction
    const transaction = await new TransferTransaction()
      .addTokenTransfer(
        TokenId.fromString(TRST_TOKEN_ID),
        AccountId.fromString(CULTURE_WALLET_OPERATOR_ID),
        -AMOUNT_TO_TRANSFER
      )
      .addTokenTransfer(
        TokenId.fromString(TRST_TOKEN_ID),
        AccountId.fromString(TRUSTMESH_OPERATOR_ID),
        AMOUNT_TO_TRANSFER
      )
      .setTransactionMemo('Fund TrustMesh operator from Culture Wallet')
      .execute(client);

    console.log('⏳ Transaction submitted...');
    const receipt = await transaction.getReceipt(client);

    console.log('\n✅ Transfer successful!');
    console.log(`  Transaction ID: ${transaction.transactionId.toString()}`);
    console.log(`  Status: ${receipt.status.toString()}`);
    console.log(`\n🔗 View on HashScan:`);
    console.log(`  https://hashscan.io/testnet/transaction/${transaction.transactionId.toString()}`);

    // Verify balances
    console.log('\n📊 Verifying balances...');
    const sourceBalance = await checkBalance(client, CULTURE_WALLET_OPERATOR_ID);
    const destBalance = await checkBalance(client, TRUSTMESH_OPERATOR_ID);

    console.log(`\n  Culture Wallet (${CULTURE_WALLET_OPERATOR_ID}): ${sourceBalance} TRST`);
    console.log(`  TrustMesh (${TRUSTMESH_OPERATOR_ID}): ${destBalance} TRST`);

  } catch (error: any) {
    console.error('\n❌ Transfer failed:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

async function checkBalance(client: Client, accountId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens?token.id=${TRST_TOKEN_ID}`
    );
    const data = await response.json();
    const token = data.tokens?.find((t: any) => t.token_id === TRST_TOKEN_ID);
    return token ? (token.balance / 1_000_000).toFixed(2) : '0';
  } catch {
    return 'Error fetching';
  }
}

// Run the transfer
transferTrst()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
