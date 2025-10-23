# TrustMesh Lens Consolidation - Execution Plan

## 🎯 Mission
Consolidate Professional, GenZ, and Civic lenses into one codebase with persona switching via configuration.

**Base Branch:** `feat/civic-lens` (has everything)  
**Timeline:** 2-3 weeks  
**Outcome:** One production-ready codebase serving three markets

---

## Phase 1: Foundation & Analysis (Days 1-3)

### Day 1: Branch Audit & Backup

**Goal:** Understand what each branch has and create safety nets

#### Step 1.1: Create Backup Tags
```bash
# Tag current state of all branches for safety
git tag backup-professional-$(date +%Y%m%d) ux-variant-1-professional
git tag backup-genz-$(date +%Y%m%d) feature/genz-lens
git tag backup-civic-$(date +%Y%m%d) feat/civic-lens

# Push tags to remote for safety
git push origin --tags
```

#### Step 1.2: Extract Unique Features Per Branch
```bash
# Create feature inventory
mkdir -p docs/consolidation

# Professional unique features
git diff --name-only feature/genz-lens ux-variant-1-professional > docs/consolidation/professional-unique-files.txt

# GenZ unique features (vs Civic)
git diff --name-only feat/civic-lens feature/genz-lens > docs/consolidation/genz-unique-files.txt

# Document what makes each lens special
```

#### Step 1.3: Identify Critical Components
Create `docs/consolidation/critical-components.md`:

```markdown
# Critical Components to Preserve

## Professional Lens
- Metallic UI theme system
- Professional recognition tokens
- Enterprise-grade RBAC patterns
- LED circle visualization

## GenZ Lens  
- NFT collectible card system (already in Civic)
- 3D trading card animations (already in Civic)
- Mobile-first UX patterns (already in Civic)

## Civic Lens
- Glass morphism UI
- Campaign management tools
- FairfieldVoiceService
- All GenZ features (inherited)
```

**Deliverable:** Safety backups + feature inventory document

---

### Day 2: Design Persona Configuration System

**Goal:** Define how personas will be switched at runtime

#### Step 2.1: Design Environment Schema
Create `lib/config/persona.types.ts`:

```typescript
/**
 * TrustMesh Persona Configuration
 * 
 * Controls which features, UI themes, and services are active
 */

export type PersonaType = 'professional' | 'genz' | 'civic'

export interface PersonaConfig {
  // Core identity
  type: PersonaType
  name: string
  tagline: string
  
  // Feature flags
  features: {
    nftCollectibles: boolean
    hashinals: boolean
    civicEngagement: boolean
    enterpriseRecognition: boolean
    gamification: boolean
  }
  
  // UI theme
  theme: {
    name: 'metallic' | 'mobile-first' | 'glass-morphism'
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
  
  // Services enabled
  services: {
    recognition: 'professional' | 'hashinal' | 'civic'
    telemetry: boolean
    kns: boolean
  }
  
  // Content
  recognitionTokens: 'professional' | 'genz-nft' | 'civic-mixed'
  defaultSignals: string[]
}

export const PERSONA_CONFIGS: Record<PersonaType, PersonaConfig> = {
  professional: {
    type: 'professional',
    name: 'TrustMesh Professional',
    tagline: 'Enterprise Trust Networking',
    features: {
      nftCollectibles: false,
      hashinals: false,
      civicEngagement: false,
      enterpriseRecognition: true,
      gamification: false
    },
    theme: {
      name: 'metallic',
      primaryColor: '#C0C0C0',
      secondaryColor: '#808080',
      accentColor: '#FFD700'
    },
    services: {
      recognition: 'professional',
      telemetry: false,
      kns: false
    },
    recognitionTokens: 'professional',
    defaultSignals: ['CONTACT_BOND_REQUEST_DIRECT', 'TRUST_ALLOCATE']
  },
  
  genz: {
    type: 'genz',
    name: 'TrustMesh Campus',
    tagline: 'Level Up Your Network',
    features: {
      nftCollectibles: true,
      hashinals: true,
      civicEngagement: false,
      enterpriseRecognition: false,
      gamification: true
    },
    theme: {
      name: 'mobile-first',
      primaryColor: '#6366F1',
      secondaryColor: '#EC4899',
      accentColor: '#10B981'
    },
    services: {
      recognition: 'hashinal',
      telemetry: true,
      kns: true
    },
    recognitionTokens: 'genz-nft',
    defaultSignals: ['RECOGNITION_MINTED', 'NFT_COLLECTED', 'BOOST_RECEIVED']
  },
  
  civic: {
    type: 'civic',
    name: 'TrustMesh Civic',
    tagline: 'Power Your Campaign',
    features: {
      nftCollectibles: true,  // Inherited from GenZ
      hashinals: true,        // Inherited from GenZ
      civicEngagement: true,
      enterpriseRecognition: false,
      gamification: true      // Inherited from GenZ
    },
    theme: {
      name: 'glass-morphism',
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      accentColor: '#F59E0B'
    },
    services: {
      recognition: 'civic',
      telemetry: true,
      kns: true
    },
    recognitionTokens: 'civic-mixed',
    defaultSignals: ['SUPPORT_SAVED', 'VOLUNTEER_SAVED', 'EVENT_RSVP']
  }
}
```

#### Step 2.2: Create Configuration Loader
Create `lib/config/persona.ts`:

```typescript
import { PersonaType, PersonaConfig, PERSONA_CONFIGS } from './persona.types'

let currentPersona: PersonaConfig | null = null

export function getPersona(): PersonaConfig {
  if (!currentPersona) {
    const envPersona = (process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA || 'civic') as PersonaType
    currentPersona = PERSONA_CONFIGS[envPersona]
    
    console.log(`[Persona] Loaded: ${currentPersona.name}`)
  }
  
  return currentPersona
}

export function isFeatureEnabled(feature: keyof PersonaConfig['features']): boolean {
  return getPersona().features[feature]
}

export function getTheme() {
  return getPersona().theme
}

export function getServiceMode<T extends keyof PersonaConfig['services']>(
  service: T
): PersonaConfig['services'][T] {
  return getPersona().services[service]
}
```

#### Step 2.3: Environment Variables Schema
Update `.env.example`:

```bash
# TrustMesh Persona Configuration
# Options: professional | genz | civic
NEXT_PUBLIC_TRUSTMESH_PERSONA=civic

# Feature Overrides (optional - overrides persona defaults)
NEXT_PUBLIC_ENABLE_NFT_COLLECTIBLES=true
NEXT_PUBLIC_ENABLE_HASHINALS=true
NEXT_PUBLIC_ENABLE_CIVIC_ENGAGEMENT=true
NEXT_PUBLIC_ENABLE_GAMIFICATION=true

# Theme Override (optional)
NEXT_PUBLIC_THEME_OVERRIDE=glass-morphism

# Service Modes
NEXT_PUBLIC_RECOGNITION_SERVICE=civic
NEXT_PUBLIC_ENABLE_TELEMETRY=true
NEXT_PUBLIC_ENABLE_KNS=true

# Existing Hedera config...
NEXT_PUBLIC_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com/api/v1
# ... etc
```

**Deliverable:** TypeScript types + configuration system

---

### Day 3: File Structure Planning

**Goal:** Organize code for multi-persona support

#### Step 3.1: Proposed Directory Structure

```
lib/
├── config/
│   ├── persona.types.ts          # Persona definitions
│   ├── persona.ts                # Configuration loader
│   └── features.ts               # Feature flag helpers
│
├── services/
│   ├── recognition/
│   │   ├── ProfessionalRecognitionService.ts
│   │   ├── HashinalRecognitionService.ts
│   │   ├── CivicRecognitionService.ts
│   │   └── index.ts              # Factory pattern
│   │
│   ├── civic/
│   │   └── FairfieldVoiceService.ts
│   │
│   └── telemetry/
│       └── GenZTelemetryService.ts
│
├── themes/
│   ├── metallic.ts               # Professional theme
│   ├── mobile-first.ts           # GenZ theme  
│   ├── glass-morphism.ts         # Civic theme
│   └── index.ts                  # Theme factory
│
├── data/
│   ├── recognition-tokens/
│   │   ├── professional.json
│   │   ├── genz-nft.json
│   │   └── civic-mixed.json
│   │
│   └── signal-types/
│       ├── professional.json
│       ├── genz.json
│       └── civic.json
│
└── components/
    ├── persona-aware/            # NEW: Components that adapt
    │   ├── RecognitionCard.tsx   # Renders differently per persona
    │   ├── NavigationHeader.tsx
    │   └── SignalFeed.tsx
    │
    └── ui/                       # Shared UI components
        └── ...existing components
```

#### Step 3.2: Create Migration Checklist

Create `docs/consolidation/migration-checklist.md`:

```markdown
# Migration Checklist

## Components to Make Persona-Aware
- [ ] RecognitionCard (switches between professional/NFT/civic styles)
- [ ] NavigationHeader (different branding per persona)
- [ ] SignalFeed (filters signals by persona)
- [ ] UserProfile (different XP systems)
- [ ] SendRecognitionModal (different token catalogs)

## Services to Consolidate
- [ ] Recognition services → Factory pattern
- [ ] Telemetry → Conditional loading
- [ ] Theme system → Dynamic loading

## Data Files to Organize
- [ ] Move recognition tokens to persona-specific folders
- [ ] Organize signal types by persona
- [ ] Create shared base signals

## Pages to Update
- [ ] Home/Dashboard → persona-aware layout
- [ ] Contacts → consistent across personas
- [ ] Signals → filtered by persona type
- [ ] Profile → persona-specific achievements
```

**Deliverable:** File structure plan + migration checklist

---

## Phase 2: Implementation (Days 4-10)

### Day 4-5: Core Infrastructure

#### Step 4.1: Implement Persona System
```bash
# Create config directory
mkdir -p lib/config

# Copy type definitions and config from planning phase
# (Use designs from Day 2)
```

Create service factory pattern in `lib/services/recognition/index.ts`:

```typescript
import { getServiceMode } from '@/lib/config/persona'
import { ProfessionalRecognitionService } from './ProfessionalRecognitionService'
import { HashinalRecognitionService } from './HashinalRecognitionService'
import { CivicRecognitionService } from './CivicRecognitionService'

export function getRecognitionService() {
  const mode = getServiceMode('recognition')
  
  switch (mode) {
    case 'professional':
      return new ProfessionalRecognitionService()
    case 'hashinal':
      return new HashinalRecognitionService()
    case 'civic':
      return new CivicRecognitionService()
    default:
      return new CivicRecognitionService() // Default fallback
  }
}

// Singleton instance
let recognitionService: ReturnType<typeof getRecognitionService> | null = null

export function useRecognitionService() {
  if (!recognitionService) {
    recognitionService = getRecognitionService()
  }
  return recognitionService
}
```

#### Step 4.2: Port Professional Theme
```bash
# Extract metallic styles from professional branch
git show ux-variant-1-professional:app/globals.css > temp-metallic.css

# Create theme file
# lib/themes/metallic.ts
```

```typescript
export const metallicTheme = {
  name: 'metallic',
  colors: {
    primary: '#C0C0C0',
    secondary: '#808080',
    accent: '#FFD700',
    background: '#1A1A1A',
    surface: '#2D2D2D',
    text: '#E0E0E0'
  },
  effects: {
    glow: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))',
    metallic: 'linear-gradient(135deg, #C0C0C0 0%, #808080 50%, #C0C0C0 100%)'
  }
}
```

**Deliverable:** Working persona system + theme infrastructure

---

### Day 6-7: Component Migration

#### Step 6.1: Create Persona-Aware RecognitionCard

Create `components/persona-aware/RecognitionCard.tsx`:

```typescript
'use client'

import { getPersona, isFeatureEnabled } from '@/lib/config/persona'
import { ProfessionalRecognitionCard } from './variants/ProfessionalRecognitionCard'
import { GenZNFTCard } from './variants/GenZNFTCard'
import { CivicRecognitionCard } from './variants/CivicRecognitionCard'

interface RecognitionCardProps {
  recognition: any // TODO: proper type
  onClick?: () => void
}

export function RecognitionCard(props: RecognitionCardProps) {
  const persona = getPersona()
  
  // Route to appropriate card variant based on persona
  switch (persona.type) {
    case 'professional':
      return <ProfessionalRecognitionCard {...props} />
      
    case 'genz':
      if (isFeatureEnabled('nftCollectibles')) {
        return <GenZNFTCard {...props} />
      }
      return <ProfessionalRecognitionCard {...props} />
      
    case 'civic':
      // Civic can show both GenZ cards and civic-specific cards
      if (props.recognition.category === 'civic') {
        return <CivicRecognitionCard {...props} />
      }
      return <GenZNFTCard {...props} />
      
    default:
      return <ProfessionalRecognitionCard {...props} />
  }
}
```

#### Step 6.2: Extract Card Variants

```bash
# Extract professional card from professional branch
git show ux-variant-1-professional:components/RecognitionCard.tsx > components/persona-aware/variants/ProfessionalRecognitionCard.tsx

# GenZ card is already in current branch (civic)
cp components/GenZNFTCard.tsx components/persona-aware/variants/GenZNFTCard.tsx

# Create civic-specific variant
# components/persona-aware/variants/CivicRecognitionCard.tsx
```

#### Step 6.3: Update All Card Usage

```bash
# Find all RecognitionCard imports
grep -r "import.*RecognitionCard" app/ --include="*.tsx"

# Replace with persona-aware version
# Do this file by file with find-replace
```

**Deliverable:** Persona-aware components working

---

### Day 8-9: Data Organization

#### Step 8.1: Reorganize Recognition Tokens

```bash
# Create persona-specific data directories
mkdir -p lib/data/recognition-tokens

# Extract professional tokens
git show ux-variant-1-professional:lib/services/ProfessionalRecognitionService.ts \
  | grep -A 200 "PROFESSIONAL_RECOGNITION_TOKENS" \
  > lib/data/recognition-tokens/professional.json.extract

# GenZ tokens already exist
cp recognition-tokens-clean.json lib/data/recognition-tokens/genz-nft.json

# Civic tokens = GenZ + civic signals
# Merge them
```

Create `lib/data/recognition-tokens/index.ts`:

```typescript
import { getPersona } from '@/lib/config/persona'
import professionalTokens from './professional.json'
import genzTokens from './genz-nft.json'
import civicTokens from './civic-mixed.json'

export function getRecognitionTokens() {
  const persona = getPersona()
  
  switch (persona.recognitionTokens) {
    case 'professional':
      return professionalTokens
    case 'genz-nft':
      return genzTokens
    case 'civic-mixed':
      return civicTokens
    default:
      return civicTokens
  }
}
```

#### Step 8.2: Consolidate Signal Types

```bash
# Move signal types
mkdir -p lib/data/signal-types

mv data/signal-types.genz.json lib/data/signal-types/genz.json

# Extract professional signals
git show ux-variant-1-professional:lib/types/signals.ts \
  > lib/data/signal-types/professional.ts

# Civic signals
cat > lib/data/signal-types/civic.json << 'EOF'
{
  "signals": [
    {
      "type": "SUPPORT_SAVED",
      "name": "Supporter Registered",
      "category": "civic",
      "xp": 10
    },
    {
      "type": "VOLUNTEER_SAVED",
      "name": "Volunteer Recruited",
      "category": "civic",
      "xp": 25
    },
    {
      "type": "EVENT_RSVP",
      "name": "Event RSVP",
      "category": "civic",
      "xp": 5
    }
  ]
}
EOF
```

**Deliverable:** Organized data per persona

---

### Day 10: Page-Level Updates

#### Step 10.1: Update Dashboard/Home Page

Create `app/(tabs)/page.tsx` with persona routing:

```typescript
'use client'

import { getPersona } from '@/lib/config/persona'
import { ProfessionalDashboard } from './variants/ProfessionalDashboard'
import { GenZDashboard } from './variants/GenZDashboard'
import { CivicDashboard } from './variants/CivicDashboard'

export default function HomePage() {
  const persona = getPersona()
  
  switch (persona.type) {
    case 'professional':
      return <ProfessionalDashboard />
    case 'genz':
      return <GenZDashboard />
    case 'civic':
      return <CivicDashboard />
    default:
      return <CivicDashboard />
  }
}
```

#### Step 10.2: Extract Dashboard Variants

```bash
# Professional dashboard
git show ux-variant-1-professional:app/page.tsx > app/(tabs)/variants/ProfessionalDashboard.tsx

# GenZ dashboard
git show feature/genz-lens:app/page.tsx > app/(tabs)/variants/GenZDashboard.tsx

# Civic dashboard (current)
cp app/page.tsx app/(tabs)/variants/CivicDashboard.tsx
```

**Deliverable:** All pages persona-aware

---

## Phase 3: Integration & Testing (Days 11-15)

### Day 11-12: Testing Infrastructure

#### Step 11.1: Create Persona Test Utilities

Create `lib/test-utils/persona-test-helpers.ts`:

```typescript
import { PersonaType, PERSONA_CONFIGS } from '@/lib/config/persona.types'

export function withPersona<T>(persona: PersonaType, testFn: () => T): T {
  const originalEnv = process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA
  process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA = persona
  
  try {
    return testFn()
  } finally {
    process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA = originalEnv
  }
}

export const testPersonas = ['professional', 'genz', 'civic'] as PersonaType[]
```

#### Step 11.2: Write Persona Tests

Create `lib/config/__tests__/persona.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals'
import { getPersona, isFeatureEnabled } from '../persona'
import { withPersona, testPersonas } from '@/lib/test-utils/persona-test-helpers'

describe('Persona Configuration', () => {
  testPersonas.forEach(personaType => {
    describe(`${personaType} persona`, () => {
      it('loads correct configuration', () => {
        withPersona(personaType, () => {
          const persona = getPersona()
          expect(persona.type).toBe(personaType)
          expect(persona.name).toBeTruthy()
          expect(persona.theme).toBeTruthy()
        })
      })
      
      it('has valid feature flags', () => {
        withPersona(personaType, () => {
          const persona = getPersona()
          expect(typeof persona.features.nftCollectibles).toBe('boolean')
          expect(typeof persona.features.gamification).toBe('boolean')
        })
      })
    })
  })
})
```

#### Step 11.3: Component Tests

Create `components/persona-aware/__tests__/RecognitionCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { RecognitionCard } from '../RecognitionCard'
import { withPersona, testPersonas } from '@/lib/test-utils/persona-test-helpers'

const mockRecognition = {
  id: 'test-1',
  name: 'Test Recognition',
  category: 'general'
}

describe('RecognitionCard', () => {
  testPersonas.forEach(persona => {
    it(`renders correctly for ${persona} persona`, () => {
      withPersona(persona, () => {
        render(<RecognitionCard recognition={mockRecognition} />)
        expect(screen.getByText('Test Recognition')).toBeInTheDocument()
      })
    })
  })
})
```

**Run tests:**
```bash
pnpm test
```

**Deliverable:** Test suite covering all personas

---

### Day 13-14: Manual Testing

#### Step 13.1: Create Test Matrix

Create `docs/consolidation/test-matrix.md`:

```markdown
# Manual Test Matrix

## Test Each Persona

### Professional Persona
- [ ] Set `NEXT_PUBLIC_TRUSTMESH_PERSONA=professional`
- [ ] `pnpm dev`
- [ ] Verify metallic theme loads
- [ ] Check professional recognition tokens appear
- [ ] Test contact bonding
- [ ] Test trust allocation
- [ ] Verify NO NFT features visible
- [ ] Verify NO civic engagement features

### GenZ Persona  
- [ ] Set `NEXT_PUBLIC_TRUSTMESH_PERSONA=genz`
- [ ] `pnpm dev`
- [ ] Verify mobile-first theme loads
- [ ] Check NFT collectible cards appear
- [ ] Test hashinal minting
- [ ] Test 3D card animations
- [ ] Verify gamification features
- [ ] Verify NO civic engagement features

### Civic Persona
- [ ] Set `NEXT_PUBLIC_TRUSTMESH_PERSONA=civic`
- [ ] `pnpm dev`
- [ ] Verify glass morphism theme loads
- [ ] Check civic + GenZ features both work
- [ ] Test support/volunteer registration
- [ ] Test event RSVPs
- [ ] Verify NFT features still work (inherited from GenZ)
- [ ] Verify campaign management features

## Cross-Persona Tests
- [ ] Switch personas without rebuild (just env change + restart)
- [ ] Data persists across persona changes
- [ ] HCS signals work for all personas
- [ ] Authentication works for all personas
```

#### Step 13.2: Execute Manual Tests

```bash
# Test Professional
echo "NEXT_PUBLIC_TRUSTMESH_PERSONA=professional" > .env.local.professional
cp .env.local.professional .env.local
pnpm dev
# Test in browser, check list above

# Test GenZ
echo "NEXT_PUBLIC_TRUSTMESH_PERSONA=genz" > .env.local.genz
cp .env.local.genz .env.local
pnpm dev
# Test in browser

# Test Civic
echo "NEXT_PUBLIC_TRUSTMESH_PERSONA=civic" > .env.local.civic
cp .env.local.civic .env.local
pnpm dev
# Test in browser
```

**Deliverable:** All personas tested and working

---

### Day 15: Documentation

#### Step 15.1: Update Main README

Update `README.md` with persona documentation:

```markdown
## 🎭 Persona System

TrustMesh supports three market personas from a single codebase:

### Professional Lens
Enterprise-grade B2B trust networking
- Metallic UI theme
- Professional recognition tokens
- Enterprise RBAC patterns

**Setup:**
```bash
NEXT_PUBLIC_TRUSTMESH_PERSONA=professional
```

### GenZ Lens
Gamified social trust for college campuses
- NFT collectible cards
- 3D trading card animations
- Mobile-first UX

**Setup:**
```bash
NEXT_PUBLIC_TRUSTMESH_PERSONA=genz
```

### Civic Lens
Municipal/civic engagement platform
- Glass morphism UI
- Campaign management tools
- Inherits all GenZ features

**Setup:**
```bash
NEXT_PUBLIC_TRUSTMESH_PERSONA=civic
```

## Configuration

See `.env.example` for full configuration options.
```

#### Step 15.2: Create Persona Guide

Create `docs/PERSONA_GUIDE.md`:

```markdown
# TrustMesh Persona Guide

## Architecture

TrustMesh uses a universal architecture that adapts to three market personas:

1. **Professional** - B2B enterprise networking
2. **GenZ** - College campus gamification  
3. **Civic** - Political campaign engagement

All three personas share:
- Core HCS trust graph infrastructure
- Hedera blockchain integration
- Contact management system
- Signal/recognition base architecture

Each persona customizes:
- UI theme and styling
- Recognition token catalogs
- Available signal types
- Feature availability
- Service implementations

## How It Works

### Configuration System
- `lib/config/persona.types.ts` - Persona definitions
- `lib/config/persona.ts` - Runtime configuration loader
- Environment variable: `NEXT_PUBLIC_TRUSTMESH_PERSONA`

### Component Adaptation
Components check persona config at runtime:

```typescript
import { getPersona, isFeatureEnabled } from '@/lib/config/persona'

function MyComponent() {
  const persona = getPersona()
  
  if (isFeatureEnabled('nftCollectibles')) {
    return <NFTView />
  }
  
  return <StandardView />
}
```

### Service Factories
Services are instantiated based on persona:

```typescript
import { useRecognitionService } from '@/lib/services/recognition'

const recognitionService = useRecognitionService()
// Returns ProfessionalRecognitionService, HashinalRecognitionService,
// or CivicRecognitionService based on NEXT_PUBLIC_TRUSTMESH_PERSONA
```

## Adding a New Persona

1. Add persona definition to `PERSONA_CONFIGS` in `persona.types.ts`
2. Create theme in `lib/themes/`
3. Add recognition tokens in `lib/data/recognition-tokens/`
4. Add signal types in `lib/data/signal-types/`
5. Create component variants if needed
6. Update tests
7. Document in this guide
```

**Deliverable:** Complete documentation

---

## Phase 4: Cleanup & Deploy (Days 16-18)

### Day 16: Code Cleanup

#### Step 16.1: Remove Duplicate Code

```bash
# Find duplicate files across persona variants
# Consolidate shared logic into base classes

# Example: If all three card variants share 80% code,
# create BaseRecognitionCard and have variants extend it
```

#### Step 16.2: Optimize Bundle Size

```bash
# Add dynamic imports for persona-specific code
# Only load what's needed for active persona

# Example in component variants:
const GenZNFTCard = dynamic(() => import('./variants/GenZNFTCard'))
```

#### Step 16.3: Run Linting

```bash
pnpm lint
pnpm run type-check
```

**Deliverable:** Clean, optimized codebase

---

### Day 17: Deployment Setup

#### Step 17.1: Create Vercel Environments

```bash
# Create separate Vercel projects or use environment branches

# Option A: Three separate Vercel projects
vercel --prod --env NEXT_PUBLIC_TRUSTMESH_PERSONA=professional
vercel --prod --env NEXT_PUBLIC_TRUSTMESH_PERSONA=genz
vercel --prod --env NEXT_PUBLIC_TRUSTMESH_PERSONA=civic

# Option B: One project, three environment configs
# Use Vercel's environment variables per deployment
```

#### Step 17.2: Create Deployment Documentation

Create `docs/DEPLOYMENT.md`:

```markdown
# TrustMesh Deployment Guide

## Vercel Deployment

### Option 1: Single Project with Environment Variables

1. Deploy to Vercel: `vercel`
2. Set environment variable in Vercel dashboard:
   - `NEXT_PUBLIC_TRUSTMESH_PERSONA` = `professional` | `genz` | `civic`
3. Each deployment uses different persona

### Option 2: Multiple Projects

1. Professional: Deploy to `trustmesh-professional.vercel.app`
2. GenZ: Deploy to `trustmesh-campus.vercel.app`  
3. Civic: Deploy to `trustmesh-civic.vercel.app`

Each uses same codebase, different environment configs.

## Environment Variables

Required for all personas:
```bash
NEXT_PUBLIC_MIRROR_NODE_URL=...
NEXT_PUBLIC_TOPIC_CONTACT=...
# ... other Hedera config
```

Persona selection:
```bash
NEXT_PUBLIC_TRUSTMESH_PERSONA=civic
```

Optional overrides:
```bash
NEXT_PUBLIC_ENABLE_NFT_COLLECTIBLES=true
NEXT_PUBLIC_ENABLE_TELEMETRY=true
```
```

**Deliverable:** Deployment-ready configuration

---

### Day 18: Final Validation

#### Step 18.1: Production Smoke Tests

```bash
# Deploy to staging
vercel --env NEXT_PUBLIC_TRUSTMESH_PERSONA=civic

# Run through critical paths:
# - Login/auth
# - Contact bonding
# - Recognition minting
# - Signal sending
# - Profile viewing

# Repeat for all three personas
```

#### Step 18.2: Performance Testing

```bash
# Check bundle sizes per persona
pnpm build
pnpm start

# Use Lighthouse to test:
# - Load time
# - Bundle size
# - Performance score

# Should be similar across all personas
```

#### Step 18.3: Merge to Main

```bash
# Create consolidation branch
git checkout feat/civic-lens
git checkout -b feat/persona-consolidation

# Commit all changes
git add .
git commit -m "feat: Consolidate three lenses into persona system"

# Push and create PR
git push origin feat/persona-consolidation

# After review, merge to main
git checkout main
git merge feat/persona-consolidation
git push origin main

# Tag release
git tag v2.0.0-persona-system
git push origin v2.0.0-persona-system
```

**Deliverable:** Production-ready, consolidated codebase

---

## Phase 5: Future Enhancements (Days 19-21)

### Optional Improvements

#### Dynamic Persona Switching (No Rebuild)
```typescript
// Allow users to preview different personas in-app
// Useful for demos

'use client'

export function PersonaSwitcher() {
  const [persona, setPersona] = useState<PersonaType>('civic')
  
  return (
    <select value={persona} onChange={(e) => {
      setPersona(e.target.value as PersonaType)
      window.location.reload() // Reload with new persona
    }}>
      <option value="professional">Professional</option>
      <option value="genz">GenZ Campus</option>
      <option value="civic">Civic Engagement</option>
    </select>
  )
}
```

#### Persona Analytics
```typescript
// Track which features are used most per persona
// Helps prioritize development

import { trackEvent } from '@/lib/analytics'

trackEvent('feature_used', {
  persona: getPersona().type,
  feature: 'nft_mint'
})
```

#### Hybrid Personas
```typescript
// Allow mixing features across personas
// E.g., "Professional + NFTs"

NEXT_PUBLIC_TRUSTMESH_PERSONA=professional
NEXT_PUBLIC_ENABLE_NFT_COLLECTIBLES=true  // Override
```

---

## Success Metrics

### Technical
- ✅ All three personas work from one codebase
- ✅ Persona switch via environment variable only
- ✅ No code duplication (DRY principles)
- ✅ Bundle size < 500KB per persona
- ✅ Test coverage > 70%

### Business
- ✅ Can demo all three personas in one day
- ✅ Deploy to three markets simultaneously
- ✅ Maintain only one codebase
- ✅ Add new personas in < 1 week

---

## Rollback Plan

If consolidation fails:

```bash
# Return to backed-up branches
git checkout backup-civic-20251023  # Use actual tag

# Or cherry-pick working commits
git cherry-pick <commit-hash>

# Backups are in tags:
# - backup-professional-YYYYMMDD
# - backup-genz-YYYYMMDD  
# - backup-civic-YYYYMMDD
```

---

## Resources

- **Slack Channel:** #trustmesh-consolidation
- **Design Doc:** `docs/consolidation/design.md`
- **Test Matrix:** `docs/consolidation/test-matrix.md`
- **Migration Checklist:** `docs/consolidation/migration-checklist.md`

---

## Timeline Summary

| Phase | Days | Deliverable |
|-------|------|-------------|
| 1. Foundation & Analysis | 1-3 | Backups + persona design |
| 2. Implementation | 4-10 | Working persona system |
| 3. Integration & Testing | 11-15 | Tested + documented |
| 4. Cleanup & Deploy | 16-18 | Production ready |
| 5. Future Enhancements | 19-21 | Optional improvements |

**Total:** 18-21 days (3 weeks)

---

*Plan created: 2025-10-23*  
*Author: Warp AI*  
*Base branch: feat/civic-lens*
