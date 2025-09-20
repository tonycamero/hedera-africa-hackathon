# TrustMesh Hackathon Implementation

**A decentralized social trust network built on Hedera Hashgraph with Magic.link authentication**

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (with Corepack enabled)
- Hedera testnet account with HBAR
- Magic.link account (free tier available)

### Setup (5 minutes)

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd TrustMesh_hackathon
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.local.template .env.local
   ```
   
   Fill in your credentials:
   - `HEDERA_OPERATOR_ID` - Your testnet account ID
   - `HEDERA_OPERATOR_KEY` - Your testnet private key
   - `MAGIC_PUBLISHABLE_KEY` - Magic.link publishable key
   - `MAGIC_SECRET_KEY` - Magic.link secret key

3. **Create HCS Topics**
   ```bash
   npx ts-node scripts/setup.ts
   ```

4. **Seed Demo Data**
   ```bash
   npx ts-node scripts/seedData.ts
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## 📖 Implementation Guide

**📋 [Developer Workbook](./TRUSTMESH_DEVELOPER_WORKBOOK_IMPLEMENTATION.md)** - Complete 15-20 hour implementation guide

### Architecture Overview

- **Authentication:** Magic.link email-based with Hedera account provisioning
- **Storage:** HCS-native (no Solidity required)
- **State:** Derived from message replay via Mirror Node
- **Real-time:** WebSocket feeds for live updates

### Core Features

1. **🔐 Magic.link Authentication**
   - Email-based login
   - Automatic Hedera account creation
   - Self-custody wallet management

2. **👥 Contact Management**
   - QR code connections
   - Bidirectional request/accept flow
   - HCS-11 profile references

3. **🎯 Trust System (Circle of 9)**
   - Maximum 9 outbound trust allocations
   - Weighted trust (1-3 scale)
   - Trust revocation mechanism

4. **🏆 Recognition Signals**
   - Transferable achievement tokens
   - Ownership tracking via message replay
   - Issuer reputation system

## 📁 Project Structure

```
TrustMesh_hackathon/
├── 📖 TRUSTMESH_DEVELOPER_WORKBOOK_IMPLEMENTATION.md  # Complete implementation guide
├── 🔧 scripts/
│   ├── setup.ts           # HCS topic creation
│   └── seedData.ts        # Demo data seeding
├── 🏗️ app/                # Next.js App Router
├── 🧩 components/         # React components + shadcn/ui
├── 📚 lib/
│   ├── hedera/           # Hedera SDK utilities
│   ├── hooks/            # React hooks
│   └── types/            # TypeScript definitions
├── 🔗 services/          # API integrations
│   ├── MagicService.ts   # Magic.link integration
│   ├── ContactService.ts # Contact management
│   ├── TrustService.ts   # Trust system
│   └── SignalService.ts  # Signal recognition
└── 📋 docs/              # Documentation
```

## 🛠️ Development Workflow

### Phase 1: Authentication (3-4 hours)
- Implement Magic.link integration
- Create authentication hooks
- Build login/logout UI
- Test Hedera account creation

### Phase 2: Profiles (2-3 hours)
- HCS-11 profile standard
- Profile editor component
- Message publishing
- Real-time feed updates

### Phase 3: Contacts (3-4 hours)
- Contact request/accept flow
- QR code sharing
- Mutual connection tracking

### Phase 4: Trust System (3-4 hours)
- Circle of 9 implementation
- Trust allocation interface
- Weight selection (1-3)
- Trust revocation

### Phase 5: Signals (3-4 hours)
- Signal minting system
- Transfer mechanism
- Gallery with ownership
- Categories and metadata

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Debug HCS messages
open http://localhost:3000/debug
```

## 📊 Demo Script

1. **Login** with Magic.link email → show Hedera account
2. **Create Profile** → verify in activity feed
3. **Connect with QR** → demonstrate bidirectional connection
4. **Allocate Trust** → show Circle of 9 visualization
5. **Issue Signal** → transfer and track ownership
6. **Export Proof** → show HCS message envelope

## 🔗 Key Technologies

- **[Hedera Hashgraph](https://hedera.com)** - Consensus and storage layer
- **[Magic.link](https://magic.link)** - Authentication and wallet management
- **[Next.js 15](https://nextjs.org)** - React framework
- **[shadcn/ui](https://ui.shadcn.com)** - UI components
- **[TypeScript](https://typescriptlang.org)** - Type safety
- **[Zod](https://zod.dev)** - Schema validation

## 🚀 Production Deployment

See the [Developer Workbook](./TRUSTMESH_DEVELOPER_WORKBOOK_IMPLEMENTATION.md#6-production-deployment) for:
- Mainnet configuration
- Environment setup
- Monitoring and health checks
- Performance optimization

## 📞 Support

- **Implementation Issues:** Check troubleshooting section in workbook
- **Hedera Questions:** [Hedera Discord](https://discord.com/invite/hedera)
- **Magic.link Help:** [Magic.link Docs](https://magic.link/docs)

## 📝 License

MIT License - see LICENSE file for details

---

**Built for hackathons, designed for production.**

# 🔗 TrustMesh

> **Trust is the new currency. Start earning yours.**

**Chainproof credibility for the culture.** Built on Hedera. Powered by TRST.

## 🎯 What This Is

TrustMesh is **programmable trust infrastructure**—not another social app. We're building a world where your reputation travels with you, verified on-chain, impossible to fake.

**No resume. Just receipts.**

### The Flex Protocol

- **Messaging Loop** → XMTP conversations that matter
- **Payments Loop** → TRST tokens, no gatekeepers  
- **Engagement Loop** → Chainproof badges that hit different

**QR to trust loop.** Scan. Stake. Share.

## 🚀 Quick Start

\`\`\`bash
# Clone the trust layer
git clone [repo-url]
cd trustmesh

# Install dependencies
npm install

# Start earning your circle
npm run dev
\`\`\`

## 🧬 Core Concepts

### Circle of Trust
**9 tokens. 1 circle. No cap.** Maximum 9 outbound circle tokens per user. Mutual acceptance required. Scarcity creates value.

### Chainproof Badges
**Badges hit different when they're on-chain.** Non-transferable NFTs on Hedera. Revocable but immutable history.

### TRST Economy
**Earned trust. On-chain.** Native token for trust transactions. Invisible wallets via MatterFi.

## 🎨 Brand Voice

- **Confident** → We're not asking for trust, we're defining it
- **Cultural** → We speak TikTok and Hedera fluently  
- **Cryptographic** → We reference on-chain logic and verifiability
- **Human** → We joke, meme, and speak like real users

## 📚 Documentation

- [Context Engineering Rulebook](./docs/CONTEXT_ENGINEERING.md)
- [Badge & Token Library](./docs/BADGE_TOKEN_LIBRARY.md)
- [Brand Voice Guide](./docs/BRAND_VOICE_GUIDE.md)

## 🔧 Tech Stack

- **Frontend**: Next.js, Tailwind, shadcn/ui
- **Blockchain**: Hedera HCS10, HTS tokens
- **Messaging**: XMTP Protocol
- **Payments**: TRST via MatterFi/Brale
- **Identity**: Magic.link, MatterFi wallets

## 🌟 The Vision

**Reputation is programmable.** Trust doesn't need a gatekeeper. Your credibility should be portable, verifiable, and yours.

**Inscribed like it matters.**

---

> **Your trust. Your chain.**
> 
> Built on Hedera. For the culture.
