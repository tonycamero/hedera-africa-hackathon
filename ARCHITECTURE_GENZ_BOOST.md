# GenZ NFT Boost System - Architecture Brief

## Overview
The GenZ version transforms the traditional TrustMesh boost system into a collectible NFT-style experience designed to appeal to Generation Z users. Instead of simple social media-style posts, signals become collectible cards with rarity tiers, visual effects, and gamification elements.

## System Architecture

### Core Components Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
├─────────────────────────────────────────────────────────┤
│  BoostViewer.tsx  │  GenZSignalCard.tsx  │  Collections │
│  BoostActions.tsx │  Rarity System       │  Browse UI   │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                   API Gateway Layer                     │
├─────────────────────────────────────────────────────────┤
│ /api/signal/boost │ /api/signal/suggest │ /api/test-*   │
│ Anonymous Boosts  │ Template Suggestions│ Demo Signals  │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                 Blockchain Integration                   │
├─────────────────────────────────────────────────────────┤
│    Hedera Consensus Service (HCS) Topic Submission      │
│     Recognition Topic (0.0.6895261) for persistence     │
└─────────────────────────────────────────────────────────┘
```

## 1. Frontend Architecture

### 1.1 Core Components

#### `GenZSignalCard.tsx`
**Purpose**: NFT-style collectible card component with rarity-based visual effects
- **Props**: 
  - `rarity`: "common" | "rare" | "epic" | "legendary"
  - `template`, `fill`, `note`: Signal content
  - `senderHandle`, `recipientHandle`: User identities
  - `boostCount`: Social proof metric
  - `glowEffect`: Visual enhancement toggle

**Visual Features**:
- Rarity-based color schemes and gradients
- Animated effects (sparkles for legendary, pulses for epic)
- Professional typography with high contrast
- Holographic overlay effects on hover
- Boost count badges and rarity indicators

#### `BoostViewer.tsx` 
**Purpose**: Main boost page displaying individual NFT cards with social sharing
- **Route**: `/boost/[boostId]`
- **Features**:
  - Individual card spotlight with glow effects
  - Collection statistics display
  - Rarity guide educational content
  - Social sharing metadata generation
  - Call-to-action buttons for engagement

#### `BoostActions.tsx`
**Purpose**: Interactive engagement buttons for anonymous users
- **Actions**:
  - **Boost**: Anonymous increment (+1 to boost count)
  - **Suggest**: Template suggestion for alternative recognition
  - **Share**: Web Share API with clipboard fallback
- **Features**: Loading states, rate limiting, optimistic updates

### 1.2 Collections System

#### `Collections Page (/collections/page.tsx)`
**Purpose**: Gallery view of all NFT signal cards
- **Layout**: Responsive grid (1-4 columns based on screen size)
- **Filtering**: Rarity-based filter buttons with counts
- **Stats Display**: Total cards, legendary count, epic count, rare count
- **Interactions**: Hover animations, potential detail modals

### 1.3 Rarity System

```typescript
export type Rarity = "common" | "rare" | "epic" | "legendary"

const rarityThresholds = {
  common: 0-9 boosts,
  rare: 10-49 boosts, 
  epic: 50-99 boosts,
  legendary: 100+ boosts
}

const visualEffects = {
  common: "Basic card styling",
  rare: "Blue glow + subtle animations", 
  epic: "Purple glow + pulse effects",
  legendary: "Orange glow + sparkles + holographic overlay"
}
```

## 2. API Architecture

### 2.1 Boost API (`/api/signal/boost/route.ts`)

**Purpose**: Handle anonymous boost actions
- **Method**: POST
- **Rate Limiting**: 30 requests/minute per IP+boostId
- **Feature Flag**: `FEATURE_GZ_BOOST_API=1`

**Flow**:
```
POST /api/signal/boost
├─ Validate boostId format
├─ Check rate limits (IP-based)
├─ Create signal.boost@1 payload
├─ Submit to HCS topic (0.0.6895261)
└─ Return optimistic tally
```

**Payload Structure**:
```typescript
{
  t: 'signal.boost@1',
  boost_id: string,
  anon: true,
  ts: number
}
```

### 2.2 Suggest API (`/api/signal/suggest/route.ts`)

**Purpose**: Handle template suggestions from authenticated users
- **Method**: POST
- **Rate Limiting**: 10 requests/minute per session
- **Authentication**: Basic sessionId validation

**Flow**:
```
POST /api/signal/suggest  
├─ Validate boostId + def_id + sessionId
├─ Verify template exists in GENZ_TEMPLATES
├─ Content guard validation (positivity filter)
├─ Submit to HCS with user attribution
└─ Return transaction confirmation
```

### 2.3 Demo Data API (`/api/test-boosts/route.ts`)

**Purpose**: Populate demo signals for development/testing
- **GET**: Return current signal counts and boostIds
- **POST**: Add demo signals to signalsStore
- **Demo Data**: 4 pre-configured GenZ signals with different rarities

## 3. Data Flow Architecture

### 3.1 Signal Lifecycle

```
1. Signal Creation (Original)
   ├─ User creates recognition signal
   ├─ Assigned unique boostId (8-byte hex)
   └─ Stored with GenZ metadata

2. Anonymous Boost Flow
   ├─ User visits /boost/[boostId]
   ├─ Views NFT card representation
   ├─ Clicks "Boost" button
   ├─ API validates + submits to HCS
   ├─ Boost count incremented
   └─ Rarity may update based on new count

3. Template Suggestion Flow  
   ├─ User clicks "Suggest" button
   ├─ Selects alternative template
   ├─ Adds optional note
   ├─ API validates content + templates
   └─ Suggestion recorded on blockchain
```

### 3.2 Rarity Calculation

```typescript
function getRarityFromBoostCount(boostCount: number): Rarity {
  if (boostCount >= 100) return 'legendary'
  if (boostCount >= 50) return 'epic'  
  if (boostCount >= 10) return 'rare'
  return 'common'
}
```

### 3.3 Content Filtering

**Template Library** (`lib/filters/contentGuard.ts`):
```typescript
const GENZ_TEMPLATES = [
  { id: 'clutched', text: 'Clutched ___ under fire', maxFill: 40 },
  { id: 'carried', text: 'Carried the team on ___', maxFill: 40 },
  { id: 'called', text: 'Called it clean on ___', maxFill: 40 },
  // ... 6 total templates
]
```

**Content Validation**:
- Template selection validation
- Fill text length limits (40 chars)
- Note length limits (120 chars)
- Basic positivity filtering (negative word detection)

## 4. User Experience Workflows

### 4.1 Anonymous Discovery Flow

```
Social Media Share Link
        │
        ▼
/boost/[boostId] Landing
        │
        ├─ View NFT Signal Card
        ├─ See rarity + boost count
        ├─ Read collection stats
        └─ Action Options:
            ├─ 🔥 Boost (anonymous)
            ├─ 💭 Suggest (basic auth)
            ├─ 📤 Share (viral growth)
            └─ 🎯 Browse Collection
```

### 4.2 Collection Browsing Flow

```
/collections Page Entry
        │
        ├─ View Gallery of NFT Cards
        ├─ Filter by Rarity
        │   ├─ 🔥 Legendary (high social proof)
        │   ├─ ⚡ Epic (significant engagement)  
        │   ├─ ✨ Rare (moderate traction)
        │   └─ ⚪ Common (new signals)
        │
        └─ Engagement Actions:
            ├─ Click individual cards
            ├─ Hover for animations
            └─ CTA to "Start Collecting"
```

### 4.3 Viral Growth Mechanics

```
NFT Card Quality
        │
        ├─ Visual Appeal (rarity effects)
        ├─ Social Proof (boost counts)
        └─ FOMO Elements (collection stats)
                │
                ▼
        Share Motivation
                │
                ├─ Web Share API
                ├─ Optimized Social Meta Tags
                └─ Anonymous Boost Mechanics
                        │
                        ▼ 
                Network Effect Growth
```

## 5. Technical Implementation Details

### 5.1 Styling System

**Design Language**: Professional, clean typography with NFT-inspired visual effects
- **Fonts**: Sans-serif only, bold weights for readability
- **Colors**: High contrast text on solid backgrounds
- **Effects**: Gradients, glows, sparkles, holographic overlays
- **Animations**: Subtle hover states, rarity-based effects

### 5.2 Rate Limiting Strategy

```typescript
const rateLimiter = new Map<string, { count: number; resetTime: number }>()

// Boost API: 30 requests/minute per IP+boostId
// Suggest API: 10 requests/minute per sessionId  
// Simple in-memory store (Redis recommended for production)
```

### 5.3 Error Handling

- **API Validation**: Comprehensive input validation with user-friendly error messages
- **Content Guard**: Positivity filters with constructive feedback
- **Rate Limiting**: Clear remaining request counts in headers
- **Fallbacks**: Graceful degradation for missing data or API failures

### 5.4 Performance Optimizations

- **Static Data**: Demo signals pre-configured in components
- **Optimistic Updates**: Immediate UI updates before API confirmation
- **Image Optimization**: CSS-based visual effects (no heavy images)
- **Responsive Grid**: Efficient layout for various screen sizes

## 6. Blockchain Integration

### 6.1 Hedera Consensus Service (HCS)

**Topic**: Recognition topic (0.0.6895261)
**Message Format**: HCS envelope with typed payloads

```typescript
const envelope = {
  type: 'RECOGNITION_MINT',
  from: string, // Account ID or session
  nonce: number,
  ts: number,
  payload: {
    t: 'signal.boost@1' | 'signal.suggest@1',
    boost_id: string,
    // ... specific payload data
  }
}
```

### 6.2 Data Persistence

- **Boost Actions**: Recorded immutably on HCS
- **Template Suggestions**: Linked to original signal via boostId
- **Anonymous Support**: Operator account (0.0.5864559) for anonymous actions
- **Rate Limiting**: Prevents spam while maintaining openness

## 7. Security Considerations

### 7.1 Input Validation
- BoostId format validation (8-byte hex)
- Template existence verification
- Content length limits
- Basic profanity/negativity filtering

### 7.2 Rate Limiting
- IP-based limits for anonymous actions
- Session-based limits for authenticated actions
- Progressive backoff for repeated violations

### 7.3 Content Moderation
- Positive-only template library
- Content guard for user inputs
- Template suggestion validation

## 8. Deployment Architecture

### 8.1 Current Deployment
- **Platform**: Vercel
- **Branch**: `feature/genz-lens`
- **URLs**:
  - Boost Viewer: `/boost/[boostId]`
  - Collections: `/collections`
- **Feature Flag**: `FEATURE_GZ_BOOST_API=1`

### 8.2 Environment Configuration
- **HCS Topics**: Registry-based topic resolution
- **Operator Account**: 0.0.5864559 for anonymous actions
- **Rate Limiting**: In-memory store (Redis for production scaling)

## 9. Future Enhancement Opportunities

### 9.1 Gamification Features
- **Achievement System**: Badges for boost milestones
- **Leaderboards**: Top boosted signals
- **Seasonal Events**: Limited edition rarity tiers
- **Social Features**: User profiles, collections

### 9.2 Technical Improvements
- **Real-time Updates**: WebSocket for live boost counts
- **Mobile App**: Native iOS/Android versions
- **Analytics**: User engagement tracking
- **Performance**: CDN optimization for global reach

### 9.3 Monetization Potential
- **Premium Templates**: Exclusive recognition styles
- **NFT Minting**: True blockchain NFTs for top signals
- **Subscription Tiers**: Enhanced features for creators
- **Brand Partnerships**: Corporate recognition campaigns

---

*This architecture brief documents the GenZ NFT boost system as implemented in the `feature/genz-lens` branch of the TrustMesh hackathon project.*