#!/usr/bin/env tsx
// Fund tony@scend.cash account with 1.35 TRST

import {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  TokenId,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';

// TrustMesh operator (source)
const OPERATOR_ID = '0.0.5864559';
const OPERATOR_KEY = '302e020100300506032b6570042204202394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a';

// Tony's account (destination)
const TONY_ACCOUNT_ID = '0.0.7141959';

// TRST token
const TRST_TOKEN_ID = '0.0.5361653';

// Amount: 1.35 TRST = 1,350,000 smallest units (TRST has 6 decimals)
const AMOUNT = 1_350_000;

async function fundTony() {
  console.log('🚀 Funding tony@scend.cash account...\n');

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(OPERATOR_ID),
    PrivateKey.fromStringED25519(OPERATOR_KEY)
  );

  console.log('📊 Transfer Details:');
  console.log(`  From: ${OPERATOR_ID} (TrustMesh Operator)`);
  console.log(`  To: ${TONY_ACCOUNT_ID} (tony@scend.cash)`);
  console.log(`  Amount: ${AMOUNT / 1_000_000} TRST`);
  console.log(`  Token: ${TRST_TOKEN_ID}\n`);

  try {
    // First, check if Tony's account is associated with TRST token
    console.log('🔍 Checking token association...');
    const checkResponse = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${TONY_ACCOUNT_ID}/tokens?token.id=${TRST_TOKEN_ID}`
    );
    const checkData = await checkResponse.json();
    const isAssociated = checkData.tokens?.some((t: any) => t.token_id === TRST_TOKEN_ID);

    if (!isAssociated) {
      console.log('⚠️  Account not associated with TRST token, associating now...');
      
      // Need Tony's private key to associate
      // Since we don't have it, we'll use operator to pay for association
      console.log('❌ Cannot associate token - need account private key');
      console.log('💡 Tony needs to sign in again to trigger token association');
      console.log('\nTo fix this:');
      console.log('1. Update account creation endpoint to associate TRST token');
      console.log('2. Or have Tony sign a token association transaction');
      return;
    }

    console.log('✅ Token already associated\n');

    // Create transfer transaction
    console.log('💸 Sending TRST...');
    const transaction = await new TransferTransaction()
      .addTokenTransfer(
        TokenId.fromString(TRST_TOKEN_ID),
        AccountId.fromString(OPERATOR_ID),
        -AMOUNT
      )
      .addTokenTransfer(
        TokenId.fromString(TRST_TOKEN_ID),
        AccountId.fromString(TONY_ACCOUNT_ID),
        AMOUNT
      )
      .setTransactionMemo('Welcome bonus: 1.35 TRST (27 free mints)')
      .execute(client);

    console.log('⏳ Transaction submitted...');
    const receipt = await transaction.getReceipt(client);

    console.log('\n✅ Transfer successful!');
    console.log(`  Transaction ID: ${transaction.transactionId.toString()}`);
    console.log(`  Status: ${receipt.status.toString()}`);
    console.log(`\n🔗 View on HashScan:`);
    console.log(`  https://hashscan.io/testnet/transaction/${transaction.transactionId.toString()}`);

    // Wait a moment then check balance
    console.log('\n📊 Checking balance...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const balanceResponse = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${TONY_ACCOUNT_ID}/tokens?token.id=${TRST_TOKEN_ID}`
    );
    const balanceData = await balanceResponse.json();
    const token = balanceData.tokens?.find((t: any) => t.token_id === TRST_TOKEN_ID);
    const balance = token ? (token.balance / 1_000_000).toFixed(2) : '0';

    console.log(`  Tony's TRST balance: ${balance} TRST`);
    console.log(`\n🎉 tony@scend.cash is ready to mint recognitions!`);

  } catch (error: any) {
    console.error('\n❌ Transfer failed:', error.message);
    if (error.message.includes('TOKEN_NOT_ASSOCIATED')) {
      console.log('\n💡 The account needs to associate with TRST token first.');
      console.log('   Update the account creation endpoint to include token association.');
    }
    throw error;
  } finally {
    client.close();
  }
}

fundTony()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
