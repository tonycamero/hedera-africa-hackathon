// scripts/fund-operator-trst.ts
// Transfer TRST from Brale treasury (0.0.5880927) to operator (0.0.5864559)

const BRALE_API_BASE = 'https://api.brale.xyz'; // Production API
const BRALE_CLIENT_ID = 'f7642e8c-231d-4910-8b02-6a00a452ee39';
const BRALE_CLIENT_SECRET = 'r3Wbz7rBBbtRudbP7Ze~MwBw3a';

const TREASURY_ACCOUNT = '0.0.5880927'; // Has 252k TRST
const OPERATOR_ACCOUNT = '0.0.5864559'; // Needs TRST
const TRST_TOKEN_ID = '0.0.5361653';
const AMOUNT_TO_TRANSFER = 9000; // 9000 TRST (enough for ~6666 signups)

async function getBraleAccessToken() {
  const auth = Buffer.from(`${BRALE_CLIENT_ID}:${BRALE_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch('https://auth.brale.xyz/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=accounts:read accounts:write transfers:write',
  });

  if (!response.ok) {
    throw new Error(`Failed to get Brale token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getBraleAccountId(accessToken: string, hederaAccountId: string) {
  // Find the Brale account associated with this Hedera address
  const response = await fetch(`${BRALE_API_BASE}/accounts`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list accounts: ${response.status}`);
  }

  const accounts = await response.json();
  
  // Find account with matching Hedera wallet
  for (const account of accounts.data || []) {
    const addressesResponse = await fetch(
      `${BRALE_API_BASE}/accounts/${account.id}/wallet-addresses`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (addressesResponse.ok) {
      const addresses = await addressesResponse.json();
      const hederaAddress = addresses.data?.find(
        (addr: any) => addr.address === hederaAccountId && addr.network === 'HEDERA'
      );

      if (hederaAddress) {
        return account.id;
      }
    }
  }

  throw new Error(`No Brale account found for Hedera account ${hederaAccountId}`);
}

async function transferTRST() {
  console.log('[Brale] Starting TRST transfer...');
  console.log(`  From: ${TREASURY_ACCOUNT}`);
  console.log(`  To: ${OPERATOR_ACCOUNT}`);
  console.log(`  Amount: ${AMOUNT_TO_TRANSFER} TRST\n`);

  // Step 1: Authenticate
  console.log('[1/3] Getting Brale access token...');
  const accessToken = await getBraleAccessToken();
  console.log('✅ Authenticated\n');

  // Step 2: Use known Brale account ID
  const braleAccountId = '2oo4Hz8Z6hzsq9VZGL6ZS1E8LBW'; // Scend Technologies DBA CraftTrust
  console.log(`[2/3] Using Brale Account: ${braleAccountId}\n`);

  // Step 3: Create transfer
  console.log('[3/3] Creating transfer...');
  
  // Amount in smallest units (6 decimals for TRST)
  const amountInSmallestUnits = AMOUNT_TO_TRANSFER * 1_000_000;

  // Brale transfer payload per API schema
  const transferPayload = {
    amount: {
      value: amountInSmallestUnits.toString(),
      currency: 'TRST',
    },
    source: {
      value_type: 'fiat',
      transfer_type: 'payout',
    },
    destination: {
      value: OPERATOR_ACCOUNT,
    },
  };
  const idempotencyKey = `trst-fund-${Date.now()}`;
  
  const response = await fetch(
    `${BRALE_API_BASE}/accounts/${braleAccountId}/transfers`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(transferPayload),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transfer failed: ${response.status} - ${error}`);
  }

  const transfer = await response.json();
  console.log('✅ Transfer created!');
  console.log(`   Transfer ID: ${transfer.id}`);
  console.log(`   Status: ${transfer.status}`);
  console.log(`\n🎉 Success! Operator will receive ${AMOUNT_TO_TRANSFER} TRST`);
  console.log(`\nVerify at: https://hashscan.io/testnet/account/${OPERATOR_ACCOUNT}`);
}

transferTRST()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Transfer failed:', error.message);
    process.exit(1);
  });
