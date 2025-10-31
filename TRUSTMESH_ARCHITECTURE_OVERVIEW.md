# High-Level Overview of TrustMesh Architecture

TrustMesh is a gamified, decentralized social trust network built for campuses and excluded economies. It emphasizes scarcity, verifiability, and user ownership, avoiding traditional platform pitfalls like ads and data mining. Instead, it uses Hedera blockchain primitives to anchor trust, recognition signals, and portable reputation.

---

## **Core Protocol: Circle of Trust**

### **Three-Layer Trust System**
- **Contacts** (unlimited): Lightweight connections via QR-based bonding, bootstrapping the network.
- **Circle of 9** (9 max): Scarce, high-value trust allocations (25 TRST each) that carry strategic weight. Dunbar-inspired bounded system.
- **Recognition Signals** (84+ types): Peer and institutional endorsements tied to actions/achievements. Pokémon-style collecting mechanics with 0.01 TRST micro-fees.

### **Rules**
- Trust tokens are finite and revocable; all events (allocations, revocations) are immutably recorded on HCS.
- Revocations don't erase history—they create verifiable trust dynamics over time.

### **Purpose**
Creates noise-resistant, mathematically analyzable trust graphs by design. Computable in O(n), not O(n²).

---

## **Technical Foundation**

### **Hedera Consensus Service (HCS)**
- **Immutable Records**: All trust events logged on 5 HCS topics (Profile, Contact, Trust, Signal, Identity).
- **Sub-$0.01 Fees**: Enable viral, high-frequency social actions without prohibitive costs.
- **ABFT Finality**: Prevents retroactive manipulation of trust relationships.

### **HTS Token (TRST)**
- **Utility Token**: Powers recognition minting (0.01 TRST/mint) and future unlocks.
- **Deflationary**: Each mint burns from circulation.
- **1:1 Backing** (future): Physical cash via Brinks recyclers → instant TRST minting.

### **HCS-22 Identity Binding**
- **FIRST Implementation**: Bind Magic.link EVM wallets to Hedera account IDs with cryptographic proofs over HCS.
- **Portable Identities**: Profiles, trust allocations, and recognition badges travel with users across contexts.

### **Real-Time Sync**
- **Sub-2s latency**: User action → HCS consensus → Mirror Node → UI update.
- **Architecture**: REST backfill + WebSocket streaming → SignalsStore → React.

---

## **UX & Flows**

### **Mobile-First Gameplay**
- **QR Scanning**: Instant contact bonding at events, classrooms, meetups.
- **Recognition Minting**: Send "props" to peers—collect 53 Gen-Z hashinal cards.
- **Circle of 9 Strategy**: Choose wisely—only 9 trust allocations, 25 TRST each.

### **Badge & Recognition Loops**
- Earn recognition for contributions, attendance, collaboration.
- Display collection in profile—Pokémon-style completionism drives engagement.

### **Community Unlocks**
- Trust thresholds unlock features, perks, or economic opportunities (e.g., payment terms in CraftTrust).

---

## **Anti-Platform Philosophy**

### **No Extraction**
- No algorithmic feeds optimizing for engagement.
- No ads or behavioral surveillance.
- No data mining for corporate profit.

### **Portable Trust Over Lock-In**
- Your trust graph is yours—exportable, verifiable, sovereign.
- Works across campuses, communities, and commercial ecosystems (CraftTrust, civic platforms).

### **Action-Based Value Creation**
- QR check-ins at events.
- Peer-to-peer recognition badges.
- Verifiable on-chain contributions that translate to economic opportunity.

---

## **Hackathon MVP (67 Days, 300+ Commits)**

### **Delivered**
- ✅ **Circle of 9** bounded trust system with revocable allocations
- ✅ **Contact Management** with QR-based instant bonding
- ✅ **Recognition Economy** with 84 professional signals + 53 Gen-Z hashinal cards
- ✅ **HCS-22 Identity** (first implementation: Magic.link ↔ Hedera binding)
- ✅ **Real-Time Ingestion** (REST + WebSocket → sub-2s consensus to UI)
- ✅ **On-Chain Logging** for all trust events (immutable, auditable, portable)
- ✅ **~125K lines of code** across 530 TypeScript/React files

### **Validation**
- Production-ready infrastructure adapted from 2023 Hashgraph Association grant (CraftTrust).
- Built from scratch for Africa hackathon—simultaneously solved cannabis industry's missing trust layer.

---

## **Full-Circle Moment**

The Hashgraph Association funded CraftTrust's treasury infrastructure in 2023. Now they're hosting the hackathon where we built the **social trust layer** that makes that treasury infrastructure useful for real commerce.

**We came to build for Africa. We built infrastructure for every economy traditional finance excludes.** 🔥
