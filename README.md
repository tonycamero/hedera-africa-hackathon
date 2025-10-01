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

Required environment variables:

```env
# Mirror Node endpoints
NEXT_PUBLIC_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com/api/v1
NEXT_PUBLIC_MIRROR_NODE_WS=wss://testnet.mirrornode.hedera.com:5600

# HCS Topics (testnet examples)
NEXT_PUBLIC_TOPIC_CONTACT=0.0.6896005
NEXT_PUBLIC_TOPIC_TRUST=0.0.6896005  
NEXT_PUBLIC_TOPIC_RECOGNITION=0.0.6895261
NEXT_PUBLIC_TOPIC_PROFILE=0.0.6896008

# Feature flags
NEXT_PUBLIC_HCS_ENABLED=true
NEXT_PUBLIC_ALLOW_DEMO=off  # Production default
```

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

MIT License - see LICENSE file for details