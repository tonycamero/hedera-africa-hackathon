# Magic Hedera Integration

## Overview

TrustMesh uses **Magic's Hedera extension** to enable client-side signing with user-controlled Hedera accounts. This gives users true ownership of their transactions while maintaining Magic's passwordless authentication UX.

## Architecture

### Account Creation Flow

1. **User Login** (via Magic email/SMS OTP)
   - User authenticates with Magic
   - Magic issues a DID token

2. **Hedera Account Creation** (via Magic extension)
   - `magic.hedera.getPublicKey()` is called
   - Magic creates a Hedera account for the user (if doesn't exist)
   - Magic manages the private key securely (never exposed to browser)
   - Returns `{ accountId, publicKeyDer }`

3. **Account Funding** (via backend)
   - Backend funds the Magic-created account with:
     - 1 HBAR for gas
     - 1.35 TRST tokens
   - Operator pays gas for this funding transaction

### Transaction Signing Flow

All user transactions (profiles, recognitions, etc.) are signed client-side:

1. **Build Canonical Payload**
   ```typescript
   const payload = {
     type: 'PROFILE_UPDATE',
     accountId: '0.0.1234',
     displayName: 'Alice',
     bio: '...',
     avatar: '...',
     timestamp: new Date().toISOString()
   }
   ```

2. **Canonicalize & Sign**
   ```typescript
   const canonical = stableStringify(payload)
   const messageBytes = new TextEncoder().encode(canonical)
   const signatureBytes = await magic.hedera.sign(messageBytes)
   ```

3. **Submit to Backend**
   - Backend submits signed payload to HCS
   - Signature proves user authorization
   - Backend pays gas for HCS submission

## Key Components

### Client-Side

**`lib/magic.ts`**
- Initializes Magic SDK with Hedera extension
- Used for authentication and signing

**`lib/services/MagicWalletService.ts`**
- Handles login flow
- Triggers Hedera account creation via Magic
- Manages user session

**`app/onboard/page.tsx`**
- Profile creation with client-side signing
- Example of Magic Hedera signing pattern

### Server-Side

**`app/api/hedera/account/fund/route.ts`**
- Funds Magic-created accounts
- Validates Magic DID tokens
- Transfers HBAR and TRST

**`app/api/hcs/profile/route.ts`**
- Submits signed profiles to HCS
- Operator pays gas for submission
- Preserves user signature in HCS message

## Security Model

### What Users Control
- ✅ Their Hedera private key (via Magic)
- ✅ All transaction signatures
- ✅ What gets signed (full visibility)

### What Operator Controls
- ✅ Gas payment for HCS submissions
- ✅ HCS topic management
- ❌ Cannot forge user signatures
- ❌ Cannot sign on behalf of users

## Gas Payment Model

### Current (Hackathon)
- Operator pays gas for all HCS submissions
- Free for users
- TRST charges are stubbed (not enforced)

### Production
- Users pay gas from their HBAR balance (auto-funded stipend)
- TRST charged per transaction
- Operator only pays for infrastructure

## Configuration

### Environment Variables

**Client-Side (.env.local)**
```bash
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_...
```

**Server-Side (.env.local)**
```bash
MAGIC_SECRET_KEY=sk_live_...
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...
```

### Magic Dashboard Setup

1. **Enable Hedera Extension**
   - Go to Magic Dashboard → Extensions
   - Enable "Hedera" extension
   - Select network: testnet

2. **Get API Keys**
   - Publishable key: for client-side init
   - Secret key: for server-side DID validation

## Migration from Server-Side Keys

If you have existing accounts created with server-generated keys:

1. **Legacy accounts** - Cannot use Magic signing (keys not in Magic)
2. **New accounts** - Automatically use Magic Hedera
3. **Migration path** - Users can create new Magic accounts

## Testing

```bash
# 1. Login with Magic
npm run dev
# Navigate to / and login with email

# 2. Check console for:
[Magic] Initialized with Hedera extension for testnet
[Magic] Hedera account from Magic: 0.0.xxxxx
[Magic] Public key: 302a300506032b6570...

# 3. Complete onboarding
# Check for client-side signature:
[Onboarding] Profile signed: 51ce486858cacc2f...
```

## Troubleshooting

### "Magic Hedera extension failed"
- Verify Hedera extension is enabled in Magic dashboard
- Check NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is set
- Ensure using testnet (not mainnet)

### "publicKeyDer is empty"
- Magic account wasn't created properly
- Try logout and login again
- Check Magic dashboard for account creation errors

### "Signature verification failed"
- Ensure using `stableStringify` for canonical form
- Check timestamp is included in signed payload
- Verify public key format (DER encoding)

## References

- [Magic Hedera Extension Docs](https://magic.link/docs/blockchains/hedera)
- [Hedera SDK](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [HCS-11 Profile Standard](./HCS11_PROFILE_SPEC.md)
