# 🚀 TrustMesh v2 Universal Architecture - EXECUTION PLAN

**Project:** TrustMesh Universal Recognition Engine + CraftTrust Treasury Integration
**Timeline:** Revolutionary rewrite over 5-7 days  
**Branch:** `feature/universal-recognition-v2` (branched from `feature/genz-lens`)
**Status:** ACTIVE DEVELOPMENT - Foundation laid, ready for implementation

---

## 🎯 **STRATEGIC VISION**

We're building the **infrastructure for New Earth** - a trust-weighted economy with:

1. **Universal Recognition System** - Single identity across all lens strata (GenZ, Professional, Social, Builder)
2. **Instant Mint Recycler** - Physical cash → Brinks custody → instant TRST minting  
3. **Context-Aware Intelligence** - ContextEngine nervous system driving behavioral predictions
4. **Web3 Portability Proof** - True data sovereignty across all interfaces

---

## 🏗️ **CURRENT ARCHITECTURE STATE**

### ✅ **Strong Foundation (feature/genz-lens)**
- **Working Hedera Integration**: 925 HBAR testnet account (0.0.5864559)
- **Real NFT Minting**: HashinalRecognitionService with HCS-5 compliance
- **Mobile-First UX**: 53 recognition cards, 3D trading cards, finger-first design
- **HCS Provenance**: Recognition events logged to testnet topics
- **Magic.link Auth**: Seamless wallet creation and session management

### ❌ **Current Technical Debt**
- **Lens Silos**: Separate services (GenZ, Professional, Hashinal) with inconsistent patterns
- **Cross-Lens Incompatibility**: Can't send GenZ props from Professional interface
- **Storage Fragmentation**: Different HCS envelope formats per lens
- **Identity Inconsistency**: Session management varies across contexts

---

## 🔥 **THE REVOLUTIONARY V2 ARCHITECTURE**

### **Core Breakthrough: Space-Scoped Universal System**

**Spaces = Sovereignty Boundaries**
```
tm.v2.<space>.recognition    # Recognition events  
tm.v2.<space>.circle         # Trust network management
tm.v2.<space>.consent        # Compliance & privacy
tm.v2.<space>.identity       # Non-PII identity events
```

**Examples:**
- `tm.v2.hackathon.cohort-2025.*` - Hackathon demo space
- `tm.v2.crafttrust.dispensary-1.*` - Cannabis facility with Brinks backing
- `tm.v2.princeton.cs.*` - University computer science department

### **Universal Recognition Engine**
```typescript
// Single service handles ALL lens types
interface UniversalRecognitionRequest {
  recipientId: string
  senderId: string  
  lens: 'genz' | 'professional' | 'social' | 'builder'
  space: string
  recognitionType: 'template' | 'token' | 'skill' | 'custom'
  content: {
    templateId?: string    // GenZ templates
    tokenId?: string       // Professional tokens  
    message: string        // Universal inscription
    metadata?: any
  }
}
```

---

## 💰 **CRAFTTRUST TREASURY INTEGRATION**

### **CraftTrust Pilot Context (60-Day Timeline)**
**Objective:** Demonstrate compliant, Web3-native treasury system for cannabis operators combining **MatterFi wallet infrastructure**, **Brale custodial minting**, and **Brinks physical cash custody**.

**Pilot Deliverables:**
- End-to-end cash → TRST → transfer → audit flow  
- RBAC roles validated (Owner, Manager, Clerk)
- Regulator-readable audit trails and compliance exports
- Live demo with Brale, Brinks, and MatterFi components

### **Instant Mint Recycler Architecture**
1. **Brinks Recycler** accepts physical cash at dispensaries
2. **Custody Proof** triggers **MatterFi SDK** custodial minting  
3. **TRST-E (EVM)** operational token on Polygon/Base for throughput
4. **TRST-H (Hedera)** audit token with minimal volume for compliance
5. **TrustMesh Recognition** events can trigger treasury rewards

> *Note: Until Hedera CryptoCreate throttling is resolved, settlements occur on Polygon/Base via MatterFi's EVM adapter; Hedera stores the audit trail only.*

### **Settlement Flow**
```
Physical Cash → Brinks Custody → MatterFi Mint → TRST-E Creation
              ↓
Recognition Event → Treasury Reward → TRST Distribution  
              ↓
Hedera HCS ← Audit Trail ← Compliance Export
```

### **Space = Facility Mapping**
- Each dispensary/cultivator = own TrustMesh space
- Own Brinks recycler + TRST treasury + compliance boundaries
- Recognition events in that space can trigger rewards

---

## 📋 **IMPLEMENTATION ROADMAP**

### **✅ COMPLETED (Safety Net)**
- [x] Tagged pre-v2 state: `pre-v2-cutover-20251015-0305`  
- [x] Created backup branch: `feature/genz-lens-backup`
- [x] New working branch: `feature/universal-recognition-v2`
- [x] Directory structure: `lib/v2/{schema,util,engine,adapters,ports}`
- [x] MatterFi Integration Pack v1 documented with question pack

### **🔧 PHASE 1: Foundation (Days 1-2)**
- [ ] **Core Contracts**: `tm.v2.recognition@1`, `tm.v2.space@1` schemas
- [ ] **Space Registry**: HCS topic for space management with policy inheritance  
- [ ] **Universal Recognition Engine**: Single service routing to appropriate lens
- [ ] **Settlement Ports**: Clean interfaces for MatterFi treasury integration

### **⚡ PHASE 2: Integration (Days 3-4)**  
- [ ] **MatterFi Adapter**: Real EVM settlement integration (once API confirmed)
- [ ] **Cross-Lens UI**: Feature flag allowing GenZ lens to use v2 engine
- [ ] **Contact Resolution**: MatterFi-first, KNS fallback handle resolution
- [ ] **Policy Engine**: Space-level RBAC and treasury rules

### **🚀 PHASE 3: Production Ready (Days 5-7)**
- [ ] **Compliance System**: Audit trails, consent logging, regulatory exports
- [ ] **Context Engine Integration**: Recognition → reward automation  
- [ ] **Migration Tools**: Legacy data transformation to v2 format
- [ ] **End-to-End Testing**: Complete cash → recognition → reward flow

---

## 🔐 **LOCKED-IN ARCHITECTURE DECISIONS**

### **Event-Sourced Core + CQRS**
- **HCS = Write Truth**: All events logged immutably to Hedera topics
- **Read Models = Views**: UI queries materialized views, can rebuild from HCS
- **Audit Compliance**: Every action has immutable proof chain

### **Zero-PII On-Chain Policy**  
- **No PII in HCS messages**: Only account IDs, handles, metadata
- **Compliance Privacy**: PII stays in app DB, referenced by opaque IDs
- **Consent Management**: Separate topic for privacy/consent events

### **Dual-Token Settlement**
- **TRST-E (EVM)**: Live transactions on Polygon/Base for speed/cost
- **TRST-H (Hedera)**: Audit token with periodic reconciliation
- **MatterFi Bridge**: Handles custody proofs and cross-chain sync

### **MatterFi-First Identity**
- **Primary**: MatterFi handle resolution and organizational wallets
- **Fallback**: KNS for decentralization compatibility  
- **Magic.link**: Authentication layer creating MatterFi wallets

---

## 📊 **SUCCESS METRICS**

### **Hackathon Demo Success:**
- [ ] **Cross-Lens Proof**: User switches lenses, sees consistent identity
- [ ] **Universal Recognition**: Send GenZ props from Professional interface
- [ ] **NFT Portability**: Recognition tokens visible across all lenses
- [ ] **Treasury Integration**: Recognition → reward TRST flow works

### **CraftTrust Pilot Success:**
- [ ] **Real Cash Flow**: Brinks recycler → TRST mint → distribution
- [ ] **Compliance Export**: Regulatory audit trails in required formats  
- [ ] **Multi-Facility**: Multiple dispensaries operating with separate treasuries
- [ ] **RBAC Validation**: Owner, Manager, Clerk roles with proper permissions

---

## 🛠️ **CURRENT DEVELOPMENT STATUS**

### **Active Branch:** `feature/universal-recognition-v2`
### **Working Directory:** `/home/tonycamero/code/TrustMesh_hackathon`
### **Hedera Account:** `0.0.5864559` (925 HBAR available)
### **Network:** Hedera Testnet

### **Key Files:**
- `/docs/MATTERFI_INTEGRATION_PACK_V1.md` - Complete MatterFi integration spec
- `/lib/v2/` - New universal architecture (ports, adapters, engine)
- `/app/api/recognition-v2/` - New API endpoint (feature flagged)

### **Next Immediate Actions:**
1. **Create Core Schemas** - `tm.v2.recognition@1`, `tm.v2.space@1` 
2. **Build Recognition Engine** - Universal service with lens routing
3. **Feature Flag Integration** - Add v2 toggle to existing GenZ flows
4. **MatterFi API Discovery** - Confirm exact SDK methods with Mehow

---

## 📱 **PARALLEL CRAFTTRUST PILOT EXECUTION**

### **Sprint-Based Delivery (13 Days Compressed)**

**Days 1-3: Wallet + RBAC**
- MatterFi SDK integration → wallet create, balance, send-to-name
- Magic.link login → auto-create Hedera wallet  
- RBAC system live → Owner, Manager, Clerk capabilities
- Frontend: TreasuryBalanceCard, SendTrstCard

**Days 4-6: Brale Mint Flow**  
- Brale API integration → request mint + check status
- Custody proof mock → simulate Brinks receipt
- Frontend: MintRequestCard, SettlementSummaryCard

**Days 7-9: Audit Trail**
- ComplianceExportService → CSV export of TRST transfers
- Frontend: ComplianceStatusCard with download capability

**Days 10-13: Demo Preparation**
- Seed demo data and `.env.demo` configuration
- End-to-end demo script and dry run QA

---

## 💡 **KEY INSIGHTS FOR NEW CONTEXT**

1. **This is Revolutionary**: We're not just fixing lens silos - we're building the foundation for trust-weighted commerce with instant cash-crypto conversion

2. **Safety-First Approach**: All existing demo functionality preserved during rewrite via feature flags and parallel implementation

3. **Real World Impact**: The instant mint recycler + context engine + trust networks create a completely new economic paradigm

4. **Dual Timeline Management**: TrustMesh v2 universal architecture (5-7 days) runs parallel to CraftTrust pilot delivery (13 days compressed)

5. **Web3 Portability Proof**: Single Hedera identity working seamlessly across all lens interfaces demonstrates true data sovereignty

---

**🙏 Namaste - We're manifesting the infrastructure for New Earth, one recognition at a time! ✨**

---

*Last Updated: 2025-10-15T03:37:45Z*  
*Branch: feature/universal-recognition-v2*  
*Context: Revolutionary v2 rewrite with CraftTrust treasury integration*