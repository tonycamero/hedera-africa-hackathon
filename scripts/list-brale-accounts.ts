// scripts/list-brale-accounts.ts
const BRALE_API_BASE = 'https://api.brale.xyz';
const BRALE_CLIENT_ID = 'f7642e8c-231d-4910-8b02-6a00a452ee39';
const BRALE_CLIENT_SECRET = 'r3Wbz7rBBbtRudbP7Ze~MwBw3a';

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

async function listAccounts() {
  console.log('[Brale] Listing all accounts...\n');
  
  const accessToken = await getBraleAccessToken();
  console.log('✅ Authenticated\n');
  
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
  console.log('📋 Accounts:', JSON.stringify(accounts, null, 2));
  
  // List wallet addresses for each account
  for (const account of accounts.data || []) {
    console.log(`\n🏦 Account: ${account.id}`);
    console.log(`   Name: ${account.name || 'N/A'}`);
    
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
      console.log('   Wallet Addresses:');
      for (const addr of addresses.data || []) {
        console.log(`     - ${addr.network}: ${addr.address}`);
      }
    }
  }
}

listAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });
