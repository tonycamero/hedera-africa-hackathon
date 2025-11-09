# TrustMesh Accounts & Secrets

**Last Updated:** 2025-01-27  
**Environment:** Testnet  
**Purpose:** Centralized reference for all accounts, credentials, and test data

---

## 🔑 Brale API Credentials

### Production API (Current)
```
Client ID: f7642e8c-231d-4910-8b02-6a00a452ee39
Client Secret: r3Wbz7rBBbtRudbP7Ze~MwBw3a
Auth URL: https://auth.brale.xyz/oauth2/token
API Base: https://api.brale.xyz
```

### Legacy/Sandbox (Deprecated)
```
Client ID: da4049e4-5e09-481e-8dc3-e20b3433567f
Client Secret: OcqVl5qQ8bfPgIFFZQd3-0T443
```

---

## 🏦 Hedera Accounts

### Operator Account (Primary - TrustMesh)
```
Account ID: 0.0.5864559
Private Key: 302e020100300506032b6570042204202394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a
Key Type: ED25519
Network: testnet
Balance: ~924 HBAR
TRST Balance: 10,000 TRST (funded from Culture Wallet 2025-01-27)
Purpose: Backend operator for HCS messages and account creation
```

### Operator Account (Backup - Culture Wallet)
```
Account ID: 0.0.5864857
Private Key: 3030020100300706052b8104000a04220420f74a89b2b666997fcf3cada43ac37cd9c27991874e72b4883682590dc3caf25a
Key Type: ECDSA
Network: testnet
Balance: ~HBAR
TRST Balance: 20,799.70 TRST (after 10k transfer)
Purpose: Culture Wallet operator, can be used as backup funding source
Note: Used for Culture Wallet with client-side key management
```

### TRST Treasury Account (Brale Custodial)
```
Account ID: 0.0.5880927
TRST Balance: 252,000 TRST
Network: testnet
Custodian: Brale
Purpose: TRST token treasury for funding new accounts
```

### Other Test Accounts
```
0.0.5904196 - 10,000 TRST
0.0.5904191 - 10,000.0002 TRST
0.0.5864857 - 20,799.69925 TRST
0.0.5124044 - 8,000 TRST
0.0.4942182 - 50,000 TRST
```

---

## 🎫 TRST Token

```
Token ID: 0.0.5361653
Name: TRUST
Symbol: TRST
Decimals: 6
Network: Hedera Testnet
Type: Fungible Token
Total Supply: Variable (minted as needed)
```

**HashScan:** https://hashscan.io/testnet/token/0.0.5361653

---

## 🔐 Magic.link API

### Live Credentials
```
Publishable Key: pk_live_A1B0BA1B32121378
Secret Key: sk_live_346CB6E05F968445
Dashboard: https://dashboard.magic.link/
```

**Configuration:**
- Hedera extension enabled
- Network: testnet
- Email OTP enabled

---

## 📡 HCS Topics

### Recognition Topic
```
Topic ID: 0.0.6895261
Purpose: Recognition mint signals
Env Vars: NEXT_PUBLIC_HCS_RECOGNITION_TOPIC, NEXT_PUBLIC_TOPIC_RECOGNITION, NEXT_PUBLIC_TOPIC_SIGNAL, TOPIC_RECOGNITION, TOPIC_SIGNAL
```

### Contact Topic
```
Topic ID: 0.0.6896005
Purpose: Contact/connection events
Env Vars: NEXT_PUBLIC_TOPIC_CONTACT, TOPIC_CONTACT, NEXT_PUBLIC_TOPIC_TRUST, TOPIC_TRUST
```

### Profile Topic
```
Topic ID: 0.0.6896008
Purpose: User profile updates
Env Vars: NEXT_PUBLIC_TOPIC_PROFILE, TOPIC_PROFILE
```

**HashScan:**
- Recognition: https://hashscan.io/testnet/topic/0.0.6895261
- Contact: https://hashscan.io/testnet/topic/0.0.6896005
- Profile: https://hashscan.io/testnet/topic/0.0.6896008

---

## 🧪 Test Users

### Demo Login (CraftTrust)
```
Email: buyer@test.com
Password: TestPass123!
Purpose: CraftTrust backend testing
```

### Team Test Accounts (Magic.link)
```
tony@scend.cash - 0.0.7141959 (✅ Active, 1 HBAR)
alex@scend.app
sarah@scend.app
(Add more as needed)
```

### Magic-Created Accounts
```
0.0.7141959 - tony@scend.cash
  - Magic DID: did:ethr:0xD94a456b0C7958b010A9E0575D768BB78e26f2A6
  - Balance: 1 HBAR
  - TRST Balance: 0 (transfer failed - needs operator funding)
  - Private Key: Generated server-side (stored in API response)
  - Created: 2025-01-27 via Magic email OTP
```

---

## 💰 Economics

### Free Tier
- **27 free mints** per new account
- Cost per account: 1.35 TRST (27 × $0.05)
- Funded on signup automatically

### Mint Pricing
- Base fee: $0.05 TRST
- Cost floor: ~$0.026 (HCS $0.0008 + NFT $0.02 + overhead $0.005)
- Margin: ~48%
- Premium discount: 40% off = $0.03/mint

### Account Creation Costs
- 1 HBAR (for gas, ~$0.05)
- 1.35 TRST (for 27 free mints, ~$1.35)
- Total subsidy per signup: ~$1.40

---

## 🌐 Deployment

### Vercel Project
```
Project: hedera-africa-hackathon
Branch: integration/ure-v2-plus-genz
URL: [Add your Vercel URL]
```

### Environment Variables (Vercel)
```bash
# Magic.link
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_A1B0BA1B32121378

# Hedera Operator
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.5864559
HEDERA_OPERATOR_KEY=302e020100300506032b6570042204202394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a

NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_OPERATOR_ID=0.0.5864559
NEXT_PUBLIC_HEDERA_OPERATOR_KEY=302e020100300506032b6570042204202394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a

# HCS Topics
NEXT_PUBLIC_HCS_RECOGNITION_TOPIC=0.0.6895261
NEXT_PUBLIC_TOPIC_RECOGNITION=0.0.6895261
NEXT_PUBLIC_TOPIC_CONTACT=0.0.6896005
NEXT_PUBLIC_TOPIC_SIGNAL=0.0.6895261
NEXT_PUBLIC_TRST_TOKEN_ID=0.0.5361653

# Server-side
TOPIC_CONTACT=0.0.6896006
TOPIC_TRUST=0.0.6896005
TOPIC_SIGNAL=0.0.6895261
TOPIC_RECOGNITION=0.0.6895261
TOPIC_PROFILE=0.0.6896008

# Feature Flags
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_HCS_ENABLED=true
```

---

## 📝 Notes

### Pending Actions
- [ ] Transfer 9000 TRST from treasury (0.0.5880927) to operator (0.0.5864559)
- [ ] Test Magic login flow with team
- [ ] Verify Brale transfer works with new credentials

### Known Issues
- Old Brale credentials (da4049e4...) are deprecated
- Operator account needs TRST funding before MVP testing
- Some topic IDs have inconsistent env var names (TOPIC_CONTACT has two different IDs)

---

## 🔒 Security

**⚠️ IMPORTANT:**
- This file contains production secrets
- Never commit to git
- Store in secure vault (1Password/Vault)
- Rotate credentials regularly
- Use .env.local for development
- Use Vercel env vars for production

---

## 📚 Related Documents

- `DEPLOYMENT_CHECKLIST.md` - Deployment steps
- `docs/RECOGNITION_MINTING_ARCHITECTURE.md` - Mint flow architecture
- `.env.local` - Local environment variables
- `scripts/fund-operator-trst.ts` - Brale transfer script

---

**Questions or issues?** Update this document and commit to the repo (after removing sensitive data).
