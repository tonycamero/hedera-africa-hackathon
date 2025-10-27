// scripts/setup-operator-trst.ts
import 'dotenv/config';
import { 
  Client, 
  TokenAssociateTransaction,
  AccountId,
  PrivateKey,
  TokenId
} from '@hashgraph/sdk';

async function setupOperatorTRST() {
  const operatorId = process.env.HEDERA_OPERATOR_ID!;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY!;
  const trstTokenId = process.env.NEXT_PUBLIC_TRST_TOKEN_ID!;

  console.log('[Setup] Operator:', operatorId);
  console.log('[Setup] TRST Token:', trstTokenId);

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromStringDer(operatorKey)
  );

  try {
    // Check if already associated
    console.log('\n[1/2] Checking token association...');
    
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(operatorId)
      .setTokenIds([TokenId.fromString(trstTokenId)])
      .freezeWith(client);

    const signedTx = await associateTx.sign(PrivateKey.fromStringDer(operatorKey));
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log('✅ Token association status:', receipt.status.toString());
    console.log('   Transaction:', txResponse.transactionId.toString());

  } catch (error: any) {
    if (error.message?.includes('TOKEN_ALREADY_ASSOCIATED')) {
      console.log('✅ Token already associated');
    } else {
      console.error('❌ Association failed:', error.message);
      throw error;
    }
  }

  console.log('\n[2/2] Next step: Transfer TRST to operator');
  console.log(`
To transfer TRST from your treasury account:

1. Go to HashScan: https://hashscan.io/testnet/account/${operatorId}
2. Or use Hedera SDK:
   - From: <your-treasury-account>
   - To: ${operatorId}
   - Amount: 200 TRST (enough for ~148 signups)
   - Token: ${trstTokenId}

After transfer, verify at:
https://hashscan.io/testnet/account/${operatorId}
  `);

  client.close();
}

setupOperatorTRST()
  .then(() => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
