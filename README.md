# TrustMesh
🎮 **A Serious Social Game for Trust-Based Commerce**

TrustMesh is a multiplayer trust-building platform that turns relationship management into engaging gameplay while creating real economic value. Built on Hedera's HCS for transparency and scalability, it's designed to be the social engagement layer for trust-based commerce ecosystems.

**Think: Pokémon GO meets LinkedIn meets actual money.**

**Perfect for college campuses**: Students collect recognition signals from faculty, build trust networks with peers, while researchers get unprecedented data on bounded social dynamics. It's viral enough for GenZ adoption, sophisticated enough for PhD-level network science.

## Quick start

```bash
# 1) Install
pnpm i

# 2) Configure local env
cp .env.example .env.local
# Edit NEXT_PUBLIC_TOPIC_* and MIRROR_* to your testnet values

# 3) Run
pnpm dev
# http://localhost:3000
```

## 🎮 Game Mechanics

TrustMesh uses a **three-token system** designed for both addictive gameplay and mathematical analysis:

- **Recognition Tokens** (<1 each): High-frequency background signals (recognition signals, acknowledgments)
- **Contact Tokens** (~1 each): Structural scaffolding requiring reciprocity to bond
- **Trust Tokens** (25 each, max 9): Scarce, high-value anchors that define your "Circle of 9"

The **Circle of 9** creates a bounded system that's both strategically engaging and computationally robust.

## 🚀 Live Demo System

TrustMesh includes an **ephemeral multiplayer demo** perfect for:
- Hackathon judging sessions
- Investor presentations  
- Campus events and conferences
- Any scenario requiring live trust-building gameplay

**Features**: Multi-user sessions, QR code scanning, real-time network effects, zero persistence

### Health & Debug

* Ingestion health: `/api/health/ingestion`
* HCS health: `/api/health/hcs`
* Registry topics: `/api/registry/topics`

### Production guarantees

* **No demo data in prod** (gated by `ALLOW_DEMO`).
* **HCS-only ingestion** (REST backfill + WebSocket, with caching).
* **Single source of truth** via Registry → Env.

See `docs/ARCHITECTURE.md` and `docs/INGESTION.md` for details.

## 🧾 Hackathon Submission Snapshot

- Track: DLT for Operations
- TRL: Prototype (TRL 4–6)
- Repository: Public, single source of truth (this repo)
- Pitch deck: [Link pending]
- Demo video (≤3 min): [Link pending]
- Collaborator added for AI judging: Hackathon@hashgraph-association.com
- Hedera Certification: [Add proof link for at least one team member]

## 🔗 Hedera Integration Summary

### Hedera Consensus Service (HCS)
- Why: Immutable, low-cost event logging for social trust data (recognitions, contacts, trust allocations). Sub-$0.01 fees enable viral, high-frequency actions; ABFT finality prevents retroactive manipulation of trust.
- Transaction types: TopicMessageSubmitTransaction (5 topics: profile, contact, trust, signal/recognition, identity)
- Economic justification: 0.01 TRST per recognition mint sustains the economy even at scale; predictable HCS fees keep operating costs negligible.

### Hedera Token Service (HTS) – TRST
- Why: Utility token for micro-fees and unlocking mechanics (recognition mints, lens unlocks).
- Transaction types: TokenAssociateTransaction, TransferTransaction
- Economic justification: Micro-pricing (0.01 TRST) feels free to users, yet aggregates into meaningful protocol revenue at scale.

### HCS‑22 Dual-Key Identity Binding (Magic.link + Hedera)
- Why: Bind EVM wallets (Magic.link ED25519) to Hedera account IDs with verifiable proofs over HCS.
- Transaction types: TopicMessageSubmitTransaction (identity topic); Mirror Node lookups for resolution.
- Impact: Seamless auth and signing while preserving auditability and self-custody.

### Real‑Time Ingestion (Mirror Node)
- Why: Sub-2s feedback loop from action → consensus → UI.
- Mechanism: REST backfill + WebSocket stream → reducer → SignalsStore.

## 🧭 Architecture Diagram (Data Flow)

```
┌─────────────┐        UI actions        ┌─────────────────────────┐
│   Next.js    │ ───────────────────────► │   API Routes (Server)   │
│   Frontend   │                          │  HCS submit + lookups   │
└──────┬──────┘                          └──────────┬──────────────┘
       │                                           │
       │ optimistic updates                        │ TopicMessageSubmit
       │                                           ▼
┌──────▼─────────┐    backfill + stream    ┌─────────────────────────┐
│  SignalsStore   │ ◄────────────────────── │   Mirror Node (REST/WS) │
│  (state layer)  │                         └──────────┬──────────────┘
└────────┬────────┘                                    │
         │                                             │
         ▼                                             ▼
      React UI                                 Hedera Consensus Service
                                      (HCS topics + HTS TRST token)
```

## 🆔 Deployed Hedera IDs (Testnet)

- Operator Account: 0.0.5864559
- TRST Token (HTS): 0.0.5361653
- HCS Topics:
  - Profile: 0.0.7148066
  - Contact: 0.0.7148063
  - Trust: 0.0.7148064
  - Signal/Recognition: 0.0.7148065
  - HCS‑22 Identity: 0.0.7157980

## 🧪 Judge Access & Demo Flow

- Public repository (this repo). Add collaborator: Hackathon@hashgraph-association.com
- Demo video (≤3 min) must show:
  1) Mint a recognition (live)  
  2) Immediately open HashScan (Mirror Node) and show the transaction hash confirmation
- Test credentials: Provided in DoraHacks submission notes (not in repo)

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System overview and layers
- [Ingestion Pipeline](docs/INGESTION.md) - Data flow and components
- [Environment Configuration](docs/ENV.md) - Setup and variables
- [Registry System](docs/REGISTRY.md) - Topic resolution and hot-swap
- [Operations Runbook](docs/RUNBOOK.md) - Deployment and troubleshooting
- [System Diagrams](docs/DIAGRAMS.md) - ASCII architecture diagrams

## Features

### 🤝 Contact Management
- Generate QR codes for connection requests
- Scan QR codes to add new contacts  
- HCS-backed contact state with Mirror Node sync

### 🎯 Trust Allocation
- Allocate trust weights to connections
- Real-time trust network updates
- Scope filtering (My/Global views)

### 🏆 Recognition System
- Two-phase ingestion (definitions → instances)
- Recognition browser with virtualized lists
- Mint and view recognition achievements

### 🔗 Circle View
- Interactive trust network visualization
- Live data from HCS ingestion pipeline
- Performance-optimized rendering

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Blockchain**: Hedera Consensus Service (HCS) on testnet
- **Data Flow**: Mirror Node REST/WebSocket → Ingestion → Store
- **State**: SignalsStore with React integration
- **Performance**: Virtualization, batching, selectors

## Development

```bash
# Development
pnpm dev

# Testing  
pnpm test

# Production build
pnpm run build

# Type checking
pnpm run type-check
```

## Environment Setup

Required environment variables (testnet):

```env
# Network + Mirror
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com/api/v1
NEXT_PUBLIC_MIRROR_NODE_WS=wss://testnet.mirrornode.hedera.com:5600

# HCS Topics (Testnet)
NEXT_PUBLIC_TOPIC_PROFILE=0.0.7148066
NEXT_PUBLIC_TOPIC_CONTACT=0.0.7148063
NEXT_PUBLIC_TOPIC_TRUST=0.0.7148064
NEXT_PUBLIC_TOPIC_SIGNAL=0.0.7148065
NEXT_PUBLIC_HCS_RECOGNITION_TOPIC=0.0.7148065

# HTS (TRST utility token)
NEXT_PUBLIC_TRST_TOKEN_ID=0.0.5361653

# HCS‑22 Identity (DID binding)
HCS22_IDENTITY_TOPIC_ID=0.0.7157980

# Feature flags (safe defaults for demo)
NEXT_PUBLIC_HCS_ENABLED=true
NEXT_PUBLIC_DEMO_MODE=true
```

Security: Do not commit private keys. Provide judge test credentials via DoraHacks submission notes.

See [Environment Configuration](docs/ENV.md) for complete setup guide.

## 🌍 Ecosystem Integration

TrustMesh is designed as the **social engagement layer** for broader trust-based commerce infrastructure:

- **ContextEngine**: Real-time awareness with intelligent suggestions across payment/messaging/engagement loops
- **CraftTrust Treasury**: Cannabis marketplace where trust scores translate to actual payment terms
- **Brinks Integration**: Physical-digital bridge with cash recyclers for instant TRST minting (1:1 backing)
- **Academic Research**: Bounded dynamical systems provide unprecedented data for network science, behavioral economics, and social psychology research

Together, these create a complete stack: **Play the Game → Build Context → Unlock Value → Reinvest**

## 📄 Additional Documentation

- [Social Game Analysis](TRUSTMESH_SOCIAL_GAME_ANALYSIS.md) - Deep dive into game mechanics and psychology
- [Campus Academic Strategy](CAMPUS_ACADEMIC_STRATEGY.md) - College deployment and research applications
- [GenZ Positioning Angles](GENZ_POSITIONING_ANGLES.md) - Marketing approaches that actually slap
- [Live Demo System Specification](LIVE_DEMO_SYSTEM_SPECIFICATION.md) - Ephemeral multiplayer demo architecture
- [Architecture Map](TRUSTMESH_ARCHITECTURE_MAP.md) - Complete system routes and components

## License

MIT License - see LICENSE file for details# Trigger Vercel deployment
