# TrustMesh Hackathon Demo

## What it is

**TrustMesh**: a small, verifiable trust layer on Hedera. Each user has a scarce **Circle of 9** trust tokens (weights 1–3). Allocations are recorded on Hedera Consensus Service (HCS-11) across four topics.

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

## Demo Script (60–90 sec)

1. **Open app** → Show "DEMO MODE" badge and "4 Topics Live"
2. **Activity Feed** → Point to seeded PROFILE/CONTACT/TRUST/SIGNAL events
3. **Select weight** → Choose 1, 2, or 3 for trust allocation
4. **Click "Allocate Trust"** → Submit to TRUST topic
5. **Point to feed** → New `TRUST_ALLOCATE` appears within seconds
6. **Architecture view** → Show the 4 topic IDs live on Hedera testnet

## Technical Implementation

* **Real HCS Topics**: Created on Hedera testnet with actual HBAR fees
* **Envelope Signing**: Simplified signature for demo (production would use proper cryptographic signing)
* **Message Format**: Compatible with HCS-11 standards for profile data
* **Local Caching**: localStorage for immediate UI feedback + actual HCS submission

## What's Next (production roadmap)

* **Brale/TRST**: Regulated stablecoin rails for trust-based payments
* **MatterFi**: Self-custody wallet integration for seamless UX  
* **XMTP**: End-to-end encrypted messaging based on trust relationships
* **Mirror Node**: Real-time WebSocket feeds for live activity updates

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

**Built for hackathons, designed for production.**