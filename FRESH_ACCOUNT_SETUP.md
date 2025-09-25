# 🔐 Fresh Hedera Testnet Account Setup

Since we're getting INVALID_SIGNATURE errors with the existing account, let's create a completely fresh testnet account.

## Method 1: Hedera Portal (Recommended)

1. **Visit Hedera Portal**: https://portal.hedera.com/register
2. **Create Account**: Sign up with email/GitHub
3. **Generate Testnet Account**: 
   - Go to "Testnet" section
   - Click "Create Account"
   - Download the account credentials (CSV/JSON)
4. **Get Testnet HBAR**: Use the built-in faucet to fund with ~100 HBAR

## Method 2: Testnet Faucet + Manual Key Generation

1. **Generate Keys Locally**:
   ```bash
   pnpm ts-node -e "
   const { PrivateKey } = require('@hashgraph/sdk');
   const pk = PrivateKey.generateED25519();
   console.log('Private Key:', pk.toStringDer());
   console.log('Public Key:', pk.publicKey.toStringDer());
   "
   ```

2. **Create Account via Faucet**:
   - Visit: https://portal.hedera.com/faucet
   - Paste your PUBLIC key (not private!)
   - Request testnet account creation

3. **Note the Account ID** from the faucet response

## Method 3: Use Existing Working Account

If you have another Hedera testnet account that works, you can use our `generate-fresh-account.ts` script with that as the funding source.

## Update Environment

Once you have the new account credentials, update `.env.local`:

```env
# Fresh Hedera Account
HEDERA_OPERATOR_ID=0.0.NEW_ACCOUNT_ID  
HEDERA_OPERATOR_KEY=NEW_PRIVATE_KEY_DER
```

## Verify New Account

Run our verification script:
```bash
pnpm ts-node scripts/test-hedera-connection.ts
```

Expected output:
- ✅ Balance query works
- ✅ Account info query works
- ✅ Topic creation works

## Next Steps

Once verification passes:
1. Create locked topics with the new account
2. Test the HCS submit endpoint
3. Verify recognition minting flow

The new account will have working transaction signing, allowing us to proceed with the full production architecture.