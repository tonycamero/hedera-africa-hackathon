# TrustMesh Production System
🎮 **A Serious Social Game for Trust-Based Commerce**

## What it is

**TrustMesh**: A multiplayer trust-building platform that turns relationship management into engaging gameplay. Think **Pokémon GO meets LinkedIn meets actual money** - collect recognition signals, build your professional network, and unlock real economic opportunities.

**Perfect for campus deployment**: Students collect recognition signals from faculty, build trust networks with classmates, while researchers get unprecedented data on bounded social dynamics.

### Three-Token Game System:
- **Recognition Tokens** (<1 each): High-frequency background signals (NFT badges, acknowledgments) 
- **Contact Tokens** (~1 each): Structural scaffolding requiring reciprocity to bond
- **Trust Tokens** (25 each, max 9): Scarce anchors that define your "Circle of 9"

All interactions are recorded on Hedera Consensus Service (HCS) for transparency and auditability.

## Why Hedera

* Low-cost, fast finality for append-only, replayable events
* Separate topics per stream → deterministic reconstruction

## Topics

* `PROFILE` – profile updates (0.0.6889641)
* `CONTACT` – connect request/accept (0.0.6889642)
* `TRUST` – allocate/revoke trust with weight (0.0.6889643)
* `SIGNAL` – optional recognition tokens (0.0.6889644)

## Message Envelope (example)

```json
{
  "type": "TRUST_ALLOCATE",
  "from": "0.0.5864559",
  "nonce": 1732420552000,
  "ts": 1732420552,
  "payload": { "to": "0.0.5864559", "weight": 2 },
  "sig": "[cryptographic_signature]"
}
```

## Architecture

```
UI (Next.js) → ContextEngine → HederaClient → HCS Topics → Activity Feed
```

## Core Features

### 📱 Individual Experience
1. **Identity Management** → Secure user profiles with HCS-backed data
2. **Trust Circle** → Visual trust network with allocated slots
3. **Recognition Collection** → Professional achievement badges and signals
4. **Contact Management** → Secure contact connections and verification
5. **Trust Allocation** → Strategic trust token distribution decisions
6. **Activity Feed** → Real-time network activity and updates

### 👥 Network Effects
1. **User Registration** → Secure identity creation and verification
2. **Contact Exchange** → Verified contact establishment
3. **Network Building** → Trust relationship formation and management
4. **Value Creation** → Trust-based reputation and signal accumulation
5. **Recognition Flow** → Achievement validation and peer recognition
6. **Global Activity** → Network-wide transparency and verification

## Technical Implementation

* **HCS Topics**: Production deployment on Hedera testnet
* **Envelope Signing**: Cryptographic signatures for message integrity
* **Message Format**: Full HCS-11 compatibility for profile and trust data
* **Local Caching**: Client-side caching for optimal user experience

## 🌍 Ecosystem Integration (Production)

TrustMesh is the **social engagement layer** for a complete trust-based commerce stack:

### 🎮 Game Layer (TrustMesh)
* Viral trust-building gameplay with strategic token allocation
* Campus demos, conference presentations, multiplayer sessions
* Visual feedback: LED circles, badge galleries, real-time activity feeds

### 🧠 Context Layer (ContextEngine)  
* Real-time awareness across payment/messaging/engagement loops
* Intelligent suggestions: "NFT claim detected → suggest TRST payment"
* 2-second intervals with <1ms event processing

### 💰 Value Layer (CraftTrust + Brinks)
* Cannabis marketplace where trust scores → actual payment terms
* **Physical-digital bridge**: Cash → Brinks recyclers → instant TRST minting
* 1:1 backing eliminates "fake money" perception

**The Compound Effect**: Play the Game → Build Context → Unlock Value → Reinvest

## Configuration

* **Environment Variables** → Ensure Hedera operator credentials are properly configured
* **Topic Configuration** → Verify all HCS topic IDs are set in environment
* **Network Access** → Confirm connectivity to Hedera testnet Mirror Node

## Core Components

* `app/(tabs)/` - Main application interface with trust, contacts, and signals management
* `lib/services/` - Core business logic services for HCS integration
* `lib/stores/` - Client-side state management for signals and trust data
* `components/` - Reusable UI components for trust network visualization
* `packages/hedera/` - Hedera Consensus Service client integration

## Production Readiness

✅ Production build deploys without errors
✅ Live HCS data integration functioning
✅ Trust allocation and recognition signals working
✅ Real-time activity feed displays network events
✅ Clean codebase with all mock data removed

---

**Built for viral demos, designed for trust-based commerce.**

*A serious social game with mathematical foundations and real economic impact.*
