# Recognition Token Minting Architecture
**Date:** October 26, 2025  
**Status:** Architecture Decision  
**Context:** Moving from demo simulation to production-ready recognition system

---

## Problem Statement

The current demo uses:
- Single backend Hedera account submitting all HCS messages
- `tm-alex-chen` format IDs as metadata strings (not real accounts)
- Simulated P2P activity without actual user key ownership

**This is NOT real peer-to-peer exchange** and cannot scale to production.

---

## Proposed Solution: Hybrid Minting Model

### Model Overview

**Centralized Minting + User Wallets**

Users connect real Hedera accounts, but recognition tokens are minted by TrustMesh treasury accounts to:
- Control supply and prevent spam
- Subsidize initial adoption (free mints)
- Maintain quality through curation
- Enable future monetization via TRST

### Architecture Components

#### 1. User Identity Layer
```typescript
interface User {
  hederaAccountId: string;      // 0.0.xxxxx - Real Hedera account
  walletProvider: 'HashPack' | 'Blade' | 'Magic';
  trustLevel: number;            // Earned through network activity
  recognitionBalance: {          // Tokens user holds
    received: RecognitionToken[];
    sent: RecognitionToken[];
  };
}
```

#### 2. Treasury Minting Service
```typescript
interface MintingTreasury {
  treasuryAccountId: string;     // TrustMesh treasury account
  privateKey: PrivateKey;        // Controlled by backend
  
  // Mint on behalf of user
  mintRecognition(params: {
    fromUserId: string;          // Real user Hedera ID
    toUserId: string;            // Real recipient Hedera ID
    tokenDefinitionId: string;   // 'rizz', 'goat', etc.
    message?: string;
  }): Promise<RecognitionNFT>;
}
```

#### 3. Free Mint Allowance
```typescript
interface UserMintQuota {
  userId: string;
  freeMints: number;             // 10-50 free per user
  freeMintLimit: number;         // Reset monthly
  paidMintsAvailable: number;    // Purchased with TRST
  resetDate: Date;
}
```

---

## User Flow

### Phase 1: Onboarding (Free Tier)
1. User connects Hedera wallet (HashPack/Blade)
2. System grants 25 free recognition mints
3. User can send recognition to any other connected user
4. Backend treasury mints and delivers to recipient
5. HCS records full transaction with real account IDs

### Phase 2: Power User (TRST Payment)
1. User exhausts free mints
2. UI prompts: "Get 50 more mints for 10 TRST (~$10)"
3. User swaps HBAR → TRST on SaucerSwap
4. Deposits TRST to TrustMesh
5. Quota refilled, minting continues

### Phase 3: Trust-Based Multipliers
1. High-trust users get bonus free mints
2. Circle members can mint to each other for free
3. Verified contributors earn unlimited mints

---

## Technical Implementation

### Smart Contract (Optional - Future)
```solidity
// Hedera Token Service (HTS) with minting controls
contract RecognitionMinter {
  address public treasury;
  mapping(address => uint) public quotas;
  
  function mintRecognition(
    address from,
    address to,
    string tokenId
  ) external {
    require(quotas[from] > 0, "No mints remaining");
    quotas[from]--;
    
    // Mint recognition NFT to recipient
    _mint(to, tokenId);
    
    // Record to HCS
    emit RecognitionMinted(from, to, tokenId);
  }
}
```

### Backend Service
```typescript
class RecognitionMintService {
  async mintRecognition(params: MintParams) {
    // 1. Verify sender has quota
    const quota = await this.checkQuota(params.fromUserId);
    if (!quota.hasAvailable) {
      throw new InsufficientMintsError();
    }
    
    // 2. Verify recipient is valid user
    const recipient = await this.userService.findByHederaId(params.toUserId);
    
    // 3. Treasury submits HCS message
    const hcsMessage = {
      type: 'RECOGNITION_MINT',
      from: params.fromUserId,      // Real Hedera account
      to: params.toUserId,           // Real Hedera account
      tokenId: params.tokenDefinitionId,
      metadata: this.getTokenMetadata(params.tokenDefinitionId),
      mintedBy: this.treasuryAccountId,
      timestamp: Date.now()
    };
    
    // 4. Submit with treasury keys
    await this.hcsClient.submitMessage(hcsMessage);
    
    // 5. Decrement quota
    await this.decrementQuota(params.fromUserId);
    
    return { success: true, hcsTimestamp: ... };
  }
}
```

---

## Pricing Model

### Free Tier
- 25 free mints per month
- Resets on the 1st
- Bonus mints for referrals

### TRST Payment Tiers
- **10 TRST** → 50 mints (~$0.20/mint)
- **50 TRST** → 300 mints (~$0.17/mint, 15% discount)
- **200 TRST** → 1500 mints (~$0.13/mint, 35% discount)

### Premium Users
- **Circle Members** → Free mints within circle
- **Verified Contributors** → Unlimited free mints
- **High Trust (>500)** → 2x free mint quota

---

## Benefits of This Model

### User Perspective
✅ Real Hedera accounts - Users own their identity  
✅ Free to start - 25 mints removes friction  
✅ Pay as you grow - Only power users need TRST  
✅ Trust rewards - Network participation = more mints  

### TrustMesh Perspective
✅ Quality control - Prevent spam via quotas  
✅ Revenue stream - TRST purchases for mints  
✅ Network effects - HBAR → TRST swap drives liquidity  
✅ Scalability - Treasury manages gas/fees centrally  

### Technical Benefits
✅ Real blockchain identities - No more tm- simulation  
✅ Portable reputation - Recognition travels with wallet  
✅ Cross-platform - Works with any Hedera wallet  
✅ Compliance ready - Real KYC tied to accounts  

---

## Migration Path

### From Current Demo
1. ✅ **Keep existing HCS data** - Historical signals remain
2. ✅ **Migrate contacts** - Map tm- IDs to Hedera accounts
3. ✅ **Update UI** - Add wallet connect flow
4. ✅ **Deploy quotas** - Initialize free mint balances

### Development Phases

**Phase 1: Wallet Integration (Week 1-2)**
- Add HashPack/Blade wallet connect
- User profile stores Hedera account ID
- Read-only: show user's token balance

**Phase 2: Treasury Minting (Week 3-4)**
- Backend treasury account setup
- Mint service with quota enforcement
- Update recognition send flow

**Phase 3: TRST Integration (Week 5-6)**
- TRST payment processor
- Quota refill transactions
- SaucerSwap integration for HBAR→TRST

**Phase 4: Trust Multipliers (Week 7-8)**
- Trust-based quota bonuses
- Circle member free mints
- Verified user unlimited tier

---

## Open Questions

1. **Redemption?** Can users ever convert recognition back to TRST?
2. **Secondary Market?** Should rare recognitions be tradeable?
3. **Curation?** Who controls which token types are mintable?
4. **Multi-sig?** Should high-value mints require approval?

---

## Related Documents

- `docs/sessions/SESSION_2025-10-26_recognition-nft-showcase.md`
- `RECOGNITION_TOKENS_DATASET.md`
- `scripts/seed-recognition-signals.ts`

---

**Decision:** Approved for development  
**Next Steps:** Wallet integration spike (HashPack SDK)  
**Owner:** Engineering Team  
**Timeline:** 8 weeks to production
