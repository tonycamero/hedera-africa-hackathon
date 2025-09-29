# TrustMesh
<!-- Demo branch for Alex Chen hackathon presentation -->

HCS-native social trust signals on Hedera (testnet).

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

## License

MIT License - see LICENSE file for details