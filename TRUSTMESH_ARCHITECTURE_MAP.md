# 🌐 TrustMesh Application Architecture Map

**A comprehensive map of routes, endpoints, Topic IDs, and system components**

---

## 📱 Frontend Routes & Navigation

### Main Application Routes
| Route | Page Component | Description | Tab Navigation |
|-------|---------------|-------------|----------------|
| `/` | `app/page.tsx` | Landing/Root page | - |
| `/circle` | `app/(tabs)/circle/page.tsx` | Circle of Trust dashboard | ✅ Primary |
| `/signals` | `app/(tabs)/signals/page.tsx` | Activity feed & signals | ✅ Primary |
| `/contacts` | `app/(tabs)/contacts/page.tsx` | Contact management | ✅ Primary |
| `/recognition` | `app/(tabs)/recognition/page.tsx` | Recognition signals gallery | - |

### Debug Routes
| Route | Page Component | Description |
|-------|---------------|-------------|
| `/debug/hcs` | `app/debug/hcs/page.tsx` | HCS debugging interface |
| `/debug/recognition` | `app/debug/recognition/page.tsx` | Recognition system debug |

---

## 🔗 API Endpoints

### Core API Routes
| Endpoint | File | Method | Description |
|----------|------|--------|-------------|
| `/api/health/hcs` | `app/api/health/hcs/route.ts` | GET | HCS system health check |
| `/api/hcs/submit` | `app/api/hcs/submit/route.ts` | POST | Submit message to HCS topic |
| `/api/hcs/test-submit` | `app/api/hcs/test-submit/route.ts` | POST | Test HCS message submission |
| `/api/hcs/profile` | `app/api/hcs/profile/route.ts` | POST/GET | Profile management via HCS |
| `/api/hcs/mint-recognition` | `app/api/hcs/mint-recognition/route.ts` | POST | Mint recognition NFT |

### Profile & Session Management
| Endpoint | File | Method | Description |
|----------|------|--------|-------------|
| `/api/profile/update` | `app/api/profile/update/route.ts` | POST | Update user profile |
| `/api/registry/topics` | `app/api/registry/topics/route.ts` | GET | Get registry topic IDs |

### Demo & Seeding
| Endpoint | File | Method | Description |
|----------|------|--------|-------------|
| `/api/seed-demo` | `app/api/seed-demo/route.ts` | POST | Seed demo data |
| `/api/seed-hcs` | `app/api/seed-hcs/route.ts` | POST | Seed HCS topics with data |
| `/api/seed-recognition` | `app/api/seed-recognition/route.ts` | POST | Seed recognition definitions |

### Debug APIs
| Endpoint | File | Method | Description |
|----------|------|--------|-------------|
| `/api/debug/mirror` | `app/api/debug/mirror/route.ts` | GET | Mirror Node debug info |
| `/api/debug/store` | `app/api/debug/store/route.ts` | GET | SignalsStore debug data |
| `/api/debug-client-env` | `app/api/debug-client-env/route.ts` | GET | Client environment variables |
| `/api/debug-feed` | `app/api/debug-feed/route.ts` | GET | Feed service debug |
| `/api/debug-init` | `app/api/debug-init/route.ts` | GET | Initialization debug |
| `/api/debug-session` | `app/api/debug-session/route.ts` | GET | Session debug info |

### Legacy API (Pages Router)
| Endpoint | File | Method | Description |
|----------|------|--------|-------------|
| `/api/debug/hcs2-status` | `pages/api/debug/hcs2-status.ts` | GET | HCS2 registry status |
| `/api/hcs/test` | `pages/api/hcs/test.ts` | GET | HCS connection test |

---

## 🏷️ Hedera Consensus Service (HCS) Topics

### Production Topic Configuration
| Topic Type | Topic ID | Environment Variable | Purpose |
|------------|----------|---------------------|---------|
| **Profile** | `0.0.6896008` | `NEXT_PUBLIC_TOPIC_PROFILE` | User profiles & identity |
| **Contact** | `0.0.6896005` | `NEXT_PUBLIC_TOPIC_CONTACT` | Contact requests/bonds |
| **Trust** | `0.0.6896005` | `NEXT_PUBLIC_TOPIC_TRUST` | Trust allocations (shared with contacts) |
| **Signal** | `0.0.6895261` | `NEXT_PUBLIC_TOPIC_SIGNAL` | General activity signals |
| **Recognition** | `0.0.6895261` | `NEXT_PUBLIC_TOPIC_RECOGNITION` | Recognition NFT signals (shared with signals) |

### Topic Usage Patterns
```
Contact & Trust Flow:    0.0.6896005
  ├── CONTACT_REQUEST
  ├── CONTACT_ACCEPT  
  ├── TRUST_ALLOCATE
  └── TRUST_REVOKE

Recognition & Signals:   0.0.6895261
  ├── RECOGNITION_MINT
  ├── NFT_MINT
  └── SYSTEM_UPDATE

Profile Management:      0.0.6896008
  └── PROFILE_UPDATE
```

---

## 🌐 External Service Integrations

### Hedera Network
| Service | URL | Purpose |
|---------|-----|---------|
| **Mirror Node REST** | `https://testnet.mirrornode.hedera.com/api/v1` | Historical data retrieval |
| **Mirror Node WebSocket** | `wss://testnet.mirrornode.hedera.com:5600` | Real-time message subscriptions |
| **Hedera Testnet** | `testnet` | Blockchain network |

### Account & Credentials
| Type | ID/Key | Purpose |
|------|--------|---------|
| **Operator Account** | `0.0.5864559` | Transaction signing |
| **TRST Token** | `0.0.5361653` | CraftTrust stablecoin |
| **Magic.link** | `pk_live_EF6E977B049B499A` | Web3 authentication |

---

## 🗂️ Key Data Stores & Services

### Core Services
| Service | File | Purpose |
|---------|------|---------|
| **SignalsStore** | `lib/stores/signalsStore.ts` | Central event/signal management |
| **HCSFeedService** | `lib/services/HCSFeedService.ts` | HCS topic monitoring |
| **HCSRecognitionService** | `lib/services/HCSRecognitionService.ts` | Recognition NFT management |
| **MirrorToStore** | `lib/services/MirrorToStore.ts` | Mirror Node → Store integration |
| **HCS2RegistryClient** | `lib/services/HCS2RegistryClient.ts` | Topic registry management |

### Data Flow Architecture
```
Hedera Testnet
    ↓ (HCS Messages)
Mirror Node REST/WS
    ↓ (Backfill + Live)
MirrorToStore Service
    ↓ (Processed Events)
SignalsStore (In-Memory)
    ↓ (UI Updates)
React Components
```

---

## 🔧 Environment Configuration

### Production Environment Variables
```bash
# Core Hedera Config
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.5864559
HEDERA_OPERATOR_KEY=302e020100300506032b6570042204202394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a

# Topic Configuration (Frontend Accessible)
NEXT_PUBLIC_TOPIC_PROFILE=0.0.6896008
NEXT_PUBLIC_TOPIC_CONTACT=0.0.6896005
NEXT_PUBLIC_TOPIC_TRUST=0.0.6896005
NEXT_PUBLIC_TOPIC_SIGNAL=0.0.6895261
NEXT_PUBLIC_TOPIC_RECOGNITION=0.0.6895261

# Mirror Node URLs
NEXT_PUBLIC_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com/api/v1
NEXT_PUBLIC_MIRROR_NODE_WS=wss://testnet.mirrornode.hedera.com

# Feature Flags
NEXT_PUBLIC_HCS_ENABLED=true
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_SEED=on
```

---

## 📊 Signal & Event Types

### Contact Signals
| Type | Direction | Payload | Purpose |
|------|-----------|---------|---------|
| `CONTACT_REQUEST` | outbound/inbound | `{ handle }` | Initial contact request |
| `CONTACT_ACCEPT` | outbound/inbound | `{ handle }` | Accept contact bond |

### Trust Signals
| Type | Direction | Payload | Purpose |
|------|-----------|---------|---------|
| `TRUST_ALLOCATE` | outbound | `{ weight: number }` | Allocate trust weight |
| `TRUST_REVOKE` | outbound | `{ weight: number }` | Revoke trust weight |

### Recognition Signals
| Type | Direction | Payload | Purpose |
|------|-----------|---------|---------|
| `RECOGNITION_MINT` | inbound | `{ definitionId, instanceId }` | Recognition NFT minted |
| `NFT_MINT` | inbound | `{ tokenId, metadata }` | Generic NFT mint |

### System Signals  
| Type | Direction | Payload | Purpose |
|------|-----------|---------|---------|
| `SYSTEM_UPDATE` | inbound | `{ description, version }` | Network announcements |
| `PROFILE_UPDATE` | outbound | `{ handle, bio }` | Profile changes |

---

## 🎯 User Experience Flow

### Primary User Journeys
1. **Circle Management** (`/circle`)
   - View trust connections (LED visualization)
   - See bonded contacts
   - Allocate trust weights
   - Recent activity feed

2. **Activity Monitoring** (`/signals`) 
   - Filter by signal type (contact/trust/recognition)
   - View detailed signal information
   - Copy signal IDs and payloads

3. **Contact Management** (`/contacts`)
   - Send contact requests  
   - Accept/decline requests
   - Manage bonded relationships

4. **Recognition Gallery** (`/recognition`)
   - Browse recognition signals by category
   - View signal details in modal
   - Track owned recognition NFTs

---

## 🔐 Authentication & Session

### Session Management
- **Default Session ID**: `tm-alex-chen`
- **Session Storage**: Browser localStorage
- **Magic.link Integration**: Web3 wallet authentication
- **Profile Service**: HCS-based profile management

---

## 🚀 Deployment & Infrastructure

### Development Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Environment file
.env.local (contains all configuration)
```

### Key Dependencies
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives  
- **Lucide React** - Icons
- **Hedera SDK** - Blockchain integration

---

## 🧪 Testing & Debug Utilities

### Debug Pages
- `/debug/hcs` - HCS system diagnostics
- `/debug/recognition` - Recognition system testing

### Debug APIs
- `/api/debug/*` - Various system debug endpoints
- `/api/seed-*` - Data seeding utilities
- Browser console: `window.__signalsStore` - Direct store access

---

## 📈 Monitoring & Observability

### Health Checks
- `/api/health/hcs` - HCS connectivity status
- Console logging throughout application
- Real-time WebSocket connection monitoring
- Store event counting and filtering

### Error Handling
- 404 fallbacks for Mirror Node APIs
- Service initialization retry logic
- Connection failure recovery
- Graceful degradation when services unavailable

---

*Last Updated: September 28, 2025*  
*TrustMesh v1.0 - Scend Technologies*