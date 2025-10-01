# TrustMesh Hackathon Demo
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
  "sig": "demo_signature"
}
```

## Architecture

```
UI (Next.js) → ContextEngine → HederaClient → HCS Topics → Activity Feed
```

## Demo Scripts

### 📱 Individual Demo (60–90 sec)
1. **Open app** → "You're Alice Chen in our trust network demo"
2. **Circle View** → Show LED trust circle with allocated slots (green = connected)
3. **Recognition Gallery** → Browse collected NFT badges (social/academic/professional)
4. **Contact Management** → QR code generation and scanning mechanics
5. **Trust Allocation** → Strategic choice: allocate 25-point trust token to a contact
6. **Activity Feed** → Watch real-time network effects ripple through

### 👥 Multiplayer Demo (5–10 min)
1. **Everyone opens app** → Unique demo identities generated
2. **"Let's build a live trust network"** → Generate QR codes
3. **Scan each other** → Real-time contact requests fly across the room
4. **Accept connections** → Watch bonded relationships form
5. **Allocate trust** → Strategic decisions create visible network effects
6. **Recognition exchange** → Send achievement badges to real people
7. **Global feed** → See all activity happening live in the room

## Technical Implementation

* **Real HCS Topics**: Created on Hedera testnet with actual HBAR fees
* **Envelope Signing**: Simplified signature for demo (production would use proper cryptographic signing)
* **Message Format**: Compatible with HCS-11 standards for profile data
* **Local Caching**: localStorage for immediate UI feedback + actual HCS submission

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

## Troubleshooting

* **Missing env** → Scripts abort with clear message; add Hedera operator credentials
* **Rate limits** → Seeding script includes delays; can be increased to 300-500ms if needed
* **Topic not found** → Ensure `.env.local` has all 4 topic IDs from setup script

## Files Modified

* `scripts/setup.ts` - Creates 4 HCS topics, writes IDs to environment
* `scripts/seedData.ts` - Seeds 46 demo messages across all topics
* `app/page.tsx` - Main demo interface with Trust Allocate button
* `components/ActivityFeed.tsx` - Displays live activity from all topics
* `packages/hedera/HederaClient.ts` - Actual HCS message submission

## Definition of Done

✅ App builds and runs on `npm run dev`  
✅ Seeded events visible in Activity Feed  
✅ "Allocate Trust" submits real message to Hedera TRUST topic  
✅ New entry appears in feed within seconds  
✅ No runtime errors; demo mode active by default  

---

**Built for viral demos, designed for trust-based commerce.**

*A serious social game with mathematical foundations and real economic impact.*
