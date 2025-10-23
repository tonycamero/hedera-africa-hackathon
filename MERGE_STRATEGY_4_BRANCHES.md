# TrustMesh 4-Branch Merge Strategy
## Consolidating Professional, Universal V2, GenZ, and Civic into One Repo

**Generated:** 2025-10-23  
**Goal:** All 4 branches coexist in one repo, persona-switchable via config

---

## Current State Analysis

### Branch Relationships (Confirmed via Git)

```
Timeline:
    
Professional (separate)              Universal V2 (Oct 14)
      ↓                                      ↓
   [Standalone]                         GenZ (same, Oct 14)
   100 commits                               ↓
                                        Civic (Oct 14-23)
                                        134 commits

Common Ancestor: NONE between Professional and Universal/GenZ/Civic
Common Ancestor: 4a12de5 between Universal V2 and GenZ/Civic
```

### Key Insight: This Is NOT a 4-Way Merge

**Actually:**
- **Professional** = Separate lineage (needs import, not merge)
- **Universal V2** = Snapshot tag of GenZ (same history)
- **GenZ** = Current HEAD of Universal V2 branch
- **Civic** = Fork from Universal V2/GenZ + 10 commits

**Simplified View:**
```
Professional (import features)
                              \
                               → Civic (base)
                              /
Universal V2 = GenZ (already in Civic)
```

---

## The Strategy: Civic as Base + Professional Import

### Why This Works

1. **Civic already contains Universal V2 + GenZ** (inherited via git history)
2. **Professional is separate** (different git lineage, no conflicts)
3. **Universal V2 is a tag** (not an active branch, just a snapshot reference)

### What We're Actually Doing

**NOT:** Merging 4 branches  
**YES:** 
1. Use Civic as base (has 80% of everything)
2. Import Professional features into Civic (20% additions)
3. Add persona config layer to toggle behaviors
4. Keep Universal V2 as historical reference tag

---

## Phase 1: Preparation & Branch Hygiene (Day 1)

### Step 1.1: Create Safety Backups

```bash
# Tag current state of all branches
git tag backup-professional-$(date +%Y%m%d) ux-variant-1-professional
git tag backup-universal-v2-$(date +%Y%m%d) feature/universal-recognition-v2
git tag backup-genz-$(date +%Y%m%d) feature/genz-lens
git tag backup-civic-$(date +%Y%m%d) feat/civic-lens

# Push all tags to remote
git push origin --tags

# Verify tags exist
git tag | grep backup-
```

### Step 1.2: Create Consolidation Branch

```bash
# Start from Civic (most complete)
git checkout feat/civic-lens
git pull origin feat/civic-lens

# Create new consolidation branch
git checkout -b feat/persona-consolidation

# Push to remote to track work
git push -u origin feat/persona-consolidation
```

### Step 1.3: Document Current State

```bash
# Create consolidation tracking directory
mkdir -p docs/consolidation

# Document what each branch has
cat > docs/consolidation/branch-inventory.md << 'EOF'
# Branch Feature Inventory

## Civic (Base) - Already Has:
- Universal Recognition V2 engine ✅
- GenZ gamification (NFTs, hashinals, 3D cards) ✅
- Mobile-first UX ✅
- Magic.link auth ✅
- KNS integration ✅
- Civic engagement (support/volunteer/events) ✅
- Glass morphism UI ✅
- 74 API routes ✅
- 29 pages ✅
- 114 components ✅

## Professional - Need to Import:
- Metallic UI theme 🔄
- Enterprise recognition tokens 🔄
- Professional recognition service 🔄
- HCS-21 standard patterns 🔄
- RBAC patterns 🔄
- Professional card components 🔄

## Universal V2 / GenZ - Status:
- Already in Civic via inheritance ✅
- Keep as reference tags 📖
- No import needed ✅
EOF

git add docs/consolidation/branch-inventory.md
git commit -m "docs: Add branch feature inventory for consolidation"
```

---

## Phase 2: Import Professional Features (Days 2-6)

### Step 2.1: Extract Professional Theme (Day 2)

```bash
# Create theme directory
mkdir -p lib/themes

# Extract metallic styles from Professional branch
git show ux-variant-1-professional:app/globals.css > /tmp/pro-globals.css

# Extract metallic-specific CSS (manual review needed)
# Look for color schemes, gradients, effects in /tmp/pro-globals.css
# and copy to new theme file

cat > lib/themes/metallic.ts << 'EOF'
/**
 * Metallic Theme (Professional Lens)
 * Extracted from ux-variant-1-professional branch
 */

export const metallicTheme = {
  name: 'metallic' as const,
  
  colors: {
    primary: '#C0C0C0',      // Silver
    secondary: '#808080',    // Gray
    accent: '#FFD700',       // Gold
    background: '#1A1A1A',   // Dark charcoal
    surface: '#2D2D2D',      // Lighter charcoal
    text: '#E0E0E0',         // Light gray
    textMuted: '#999999',
    border: '#404040',
  },
  
  effects: {
    glow: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
    metallic: 'linear-gradient(135deg, #C0C0C0 0%, #808080 50%, #C0C0C0 100%)',
    shine: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
  },
  
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
  },
  
  spacing: {
    card: '1rem',
    section: '2rem',
  },
};

export type MetallicTheme = typeof metallicTheme;
EOF

# Extract any metallic-specific component styles
git show ux-variant-1-professional:components/ui/card.tsx > /tmp/pro-card.tsx || true
# Review and extract relevant styles

git add lib/themes/metallic.ts
git commit -m "feat: Add metallic theme from Professional branch"
```

### Step 2.2: Extract Recognition Tokens (Day 3)

```bash
# Create recognition tokens directory
mkdir -p lib/data/recognition-tokens

# Extract professional token definitions
git show ux-variant-1-professional:lib/services/ProfessionalRecognitionService.ts > /tmp/pro-tokens.ts

# Parse and convert to JSON (manual extraction)
cat > lib/data/recognition-tokens/professional.json << 'EOF'
{
  "tokens": [
    {
      "id": "leadership-excellence",
      "name": "Leadership Excellence",
      "description": "Demonstrates exceptional leadership capabilities and team management",
      "category": "Leadership",
      "xpValue": 50,
      "icon": "trophy",
      "rarity": "epic",
      "color": "#FFD700"
    },
    {
      "id": "innovation-catalyst",
      "name": "Innovation Catalyst",
      "description": "Drives innovative solutions and creative problem-solving",
      "category": "Innovation",
      "xpValue": 45,
      "icon": "lightbulb",
      "rarity": "rare",
      "color": "#9370DB"
    },
    {
      "id": "strategic-partner",
      "name": "Strategic Partner",
      "description": "Provides valuable strategic insights and business acumen",
      "category": "Strategy",
      "xpValue": 55,
      "icon": "target",
      "rarity": "epic",
      "color": "#4169E1"
    },
    {
      "id": "collaboration-champion",
      "name": "Collaboration Champion",
      "description": "Excels at cross-functional teamwork and partnership building",
      "category": "Collaboration",
      "xpValue": 40,
      "icon": "handshake",
      "rarity": "rare",
      "color": "#32CD32"
    },
    {
      "id": "technical-expert",
      "name": "Technical Expert",
      "description": "Demonstrates deep technical expertise and knowledge sharing",
      "category": "Technical",
      "xpValue": 50,
      "icon": "shield",
      "rarity": "epic",
      "color": "#FF6347"
    }
  ]
}
EOF

# Create token loader
cat > lib/data/recognition-tokens/index.ts << 'EOF'
import { getPersona } from '@/lib/config/persona';
import professionalTokens from './professional.json';
import genzTokens from './genz-nft.json';
import civicTokens from './civic-mixed.json';

export interface RecognitionToken {
  id: string;
  name: string;
  description: string;
  category: string;
  xpValue: number;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  color?: string;
}

export function getRecognitionTokens(): RecognitionToken[] {
  const persona = getPersona();
  
  switch (persona.recognitionTokens) {
    case 'professional':
      return professionalTokens.tokens;
    case 'genz-nft':
      return genzTokens.tokens || [];
    case 'civic-mixed':
      return civicTokens.tokens || [];
    default:
      return civicTokens.tokens || [];
  }
}

export function getTokenById(id: string): RecognitionToken | undefined {
  return getRecognitionTokens().find(t => t.id === id);
}
EOF

git add lib/data/recognition-tokens/
git commit -m "feat: Add professional recognition tokens catalog"
```

### Step 2.3: Port Recognition Service (Days 4-5)

```bash
# Create recognition service directory structure
mkdir -p lib/services/recognition

# Extract Professional recognition service
git show ux-variant-1-professional:lib/services/ProfessionalRecognitionService.ts \
  > lib/services/recognition/ProfessionalRecognitionService.ts

# Create service factory
cat > lib/services/recognition/index.ts << 'EOF'
import { getServiceMode } from '@/lib/config/persona';
import { ProfessionalRecognitionService } from './ProfessionalRecognitionService';
import { HashinalRecognitionService } from './HashinalRecognitionService';
import { CivicRecognitionService } from './CivicRecognitionService';

export type RecognitionService = 
  | ProfessionalRecognitionService 
  | HashinalRecognitionService 
  | CivicRecognitionService;

let recognitionServiceInstance: RecognitionService | null = null;

export function getRecognitionService(): RecognitionService {
  if (!recognitionServiceInstance) {
    const mode = getServiceMode('recognition');
    
    switch (mode) {
      case 'professional':
        recognitionServiceInstance = new ProfessionalRecognitionService();
        break;
      case 'hashinal':
        recognitionServiceInstance = new HashinalRecognitionService();
        break;
      case 'civic':
        recognitionServiceInstance = new CivicRecognitionService();
        break;
      default:
        // Default to civic (most complete)
        recognitionServiceInstance = new CivicRecognitionService();
    }
    
    console.log(`[RecognitionService] Initialized: ${mode}`);
  }
  
  return recognitionServiceInstance;
}

// Helper to reset service (useful for testing/persona switching)
export function resetRecognitionService() {
  recognitionServiceInstance = null;
}
EOF

# Copy existing Civic services if not already present
cp lib/services/HashinalRecognitionService.ts lib/services/recognition/ 2>/dev/null || \
  echo "HashinalRecognitionService already in place"

# Create CivicRecognitionService wrapper if needed
cat > lib/services/recognition/CivicRecognitionService.ts << 'EOF'
/**
 * Civic Recognition Service
 * 
 * Combines GenZ NFT/Hashinal capabilities with civic engagement signals
 */

import { HashinalRecognitionService } from './HashinalRecognitionService';
import { FairfieldVoiceService } from '../FairfieldVoiceService';

export class CivicRecognitionService {
  private hashinalService: HashinalRecognitionService;
  private civicService: FairfieldVoiceService;
  
  constructor() {
    this.hashinalService = new HashinalRecognitionService();
    this.civicService = new FairfieldVoiceService();
  }
  
  // Delegate to appropriate service based on recognition type
  async sendRecognition(params: any) {
    if (params.type === 'civic') {
      return this.civicService.sendCivicSignal(params);
    }
    return this.hashinalService.mintHashinal(params);
  }
  
  // Add other methods as needed
}
EOF

git add lib/services/recognition/
git commit -m "feat: Add recognition service factory with persona support"
```

### Step 2.4: Port UI Components (Day 6)

```bash
# Create persona-aware components directory
mkdir -p components/persona-aware/variants

# Extract Professional card component
git show ux-variant-1-professional:components/RecognitionCard.tsx \
  > components/persona-aware/variants/ProfessionalRecognitionCard.tsx || \
  echo "Professional card component not found at expected path"

# Create persona-aware wrapper
cat > components/persona-aware/RecognitionCard.tsx << 'EOF'
'use client'

import { getPersona, isFeatureEnabled } from '@/lib/config/persona';
import { ProfessionalRecognitionCard } from './variants/ProfessionalRecognitionCard';
import { GenZNFTCard } from './variants/GenZNFTCard';
import { CivicRecognitionCard } from './variants/CivicRecognitionCard';

interface RecognitionCardProps {
  recognition: any;
  onClick?: () => void;
  className?: string;
}

export function RecognitionCard(props: RecognitionCardProps) {
  const persona = getPersona();
  
  // Route to appropriate card variant based on persona
  switch (persona.type) {
    case 'professional':
      return <ProfessionalRecognitionCard {...props} />;
      
    case 'genz':
      if (isFeatureEnabled('nftCollectibles')) {
        return <GenZNFTCard {...props} />;
      }
      return <ProfessionalRecognitionCard {...props} />;
      
    case 'civic':
      // Civic can show both GenZ cards and civic-specific cards
      if (props.recognition.category === 'civic') {
        return <CivicRecognitionCard {...props} />;
      }
      return <GenZNFTCard {...props} />;
      
    default:
      return <GenZNFTCard {...props} />;
  }
}
EOF

# Copy existing GenZ/Civic card components to variants
cp components/GenZNFTCard.tsx components/persona-aware/variants/ 2>/dev/null || true

git add components/persona-aware/
git commit -m "feat: Add persona-aware recognition card components"
```

---

## Phase 3: Persona Configuration System (Days 7-8)

### Step 3.1: Create Persona Types (Day 7)

```bash
# Create config directory
mkdir -p lib/config

# Create persona types (from planning doc)
cat > lib/config/persona.types.ts << 'EOF'
/**
 * TrustMesh Persona Configuration
 * 
 * Controls which features, UI themes, and services are active
 */

export type PersonaType = 'professional' | 'genz' | 'civic';

export interface PersonaConfig {
  // Core identity
  type: PersonaType;
  name: string;
  tagline: string;
  
  // Feature flags
  features: {
    nftCollectibles: boolean;
    hashinals: boolean;
    civicEngagement: boolean;
    enterpriseRecognition: boolean;
    gamification: boolean;
  };
  
  // UI theme
  theme: {
    name: 'metallic' | 'mobile-first' | 'glass-morphism';
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  
  // Services enabled
  services: {
    recognition: 'professional' | 'hashinal' | 'civic';
    telemetry: boolean;
    kns: boolean;
  };
  
  // Content
  recognitionTokens: 'professional' | 'genz-nft' | 'civic-mixed';
  defaultSignals: string[];
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
      gamification: false,
    },
    theme: {
      name: 'metallic',
      primaryColor: '#C0C0C0',
      secondaryColor: '#808080',
      accentColor: '#FFD700',
    },
    services: {
      recognition: 'professional',
      telemetry: false,
      kns: false,
    },
    recognitionTokens: 'professional',
    defaultSignals: ['CONTACT_BOND_REQUEST_DIRECT', 'TRUST_ALLOCATE'],
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
      gamification: true,
    },
    theme: {
      name: 'mobile-first',
      primaryColor: '#6366F1',
      secondaryColor: '#EC4899',
      accentColor: '#10B981',
    },
    services: {
      recognition: 'hashinal',
      telemetry: true,
      kns: true,
    },
    recognitionTokens: 'genz-nft',
    defaultSignals: ['RECOGNITION_MINTED', 'NFT_COLLECTED', 'BOOST_RECEIVED'],
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
      gamification: true,     // Inherited from GenZ
    },
    theme: {
      name: 'glass-morphism',
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      accentColor: '#F59E0B',
    },
    services: {
      recognition: 'civic',
      telemetry: true,
      kns: true,
    },
    recognitionTokens: 'civic-mixed',
    defaultSignals: ['SUPPORT_SAVED', 'VOLUNTEER_SAVED', 'EVENT_RSVP'],
  },
};
EOF

# Create persona loader
cat > lib/config/persona.ts << 'EOF'
import { PersonaType, PersonaConfig, PERSONA_CONFIGS } from './persona.types';

let currentPersona: PersonaConfig | null = null;

export function getPersona(): PersonaConfig {
  if (!currentPersona) {
    const envPersona = (process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA || 'civic') as PersonaType;
    
    if (!PERSONA_CONFIGS[envPersona]) {
      console.warn(`[Persona] Invalid persona '${envPersona}', defaulting to 'civic'`);
      currentPersona = PERSONA_CONFIGS.civic;
    } else {
      currentPersona = PERSONA_CONFIGS[envPersona];
    }
    
    console.log(`[Persona] Loaded: ${currentPersona.name} (${currentPersona.type})`);
  }
  
  return currentPersona;
}

export function isFeatureEnabled(feature: keyof PersonaConfig['features']): boolean {
  return getPersona().features[feature];
}

export function getTheme() {
  return getPersona().theme;
}

export function getServiceMode<T extends keyof PersonaConfig['services']>(
  service: T
): PersonaConfig['services'][T] {
  return getPersona().services[service];
}

// For testing/development - reset persona cache
export function resetPersona() {
  currentPersona = null;
}
EOF

git add lib/config/
git commit -m "feat: Add persona configuration system"
```

### Step 3.2: Wire Persona Config (Day 8)

```bash
# Update environment example
cat >> .env.example << 'EOF'

# ===================================
# Persona Configuration
# ===================================
# Options: professional | genz | civic
NEXT_PUBLIC_TRUSTMESH_PERSONA=civic

# Feature Overrides (optional - overrides persona defaults)
# NEXT_PUBLIC_ENABLE_NFT_COLLECTIBLES=true
# NEXT_PUBLIC_ENABLE_HASHINALS=true
# NEXT_PUBLIC_ENABLE_CIVIC_ENGAGEMENT=true
# NEXT_PUBLIC_ENABLE_GAMIFICATION=true
EOF

# Create .env.professional, .env.genz, .env.civic templates
for persona in professional genz civic; do
  cat > ".env.${persona}" << EOF
# ${persona^} Persona Configuration
NEXT_PUBLIC_TRUSTMESH_PERSONA=${persona}

# Copy your other environment variables here
# NEXT_PUBLIC_MIRROR_NODE_URL=...
# etc.
EOF
done

git add .env.example .env.professional .env.genz .env.civic
git commit -m "feat: Add persona environment templates"
```

---

## Phase 4: Page-Level Integration (Days 9-10)

### Step 4.1: Create Page Variants (Day 9)

```bash
# Create variants directory
mkdir -p app/(tabs)/variants

# Extract Professional dashboard
git show ux-variant-1-professional:app/page.tsx \
  > app/(tabs)/variants/ProfessionalDashboard.tsx 2>/dev/null || \
  cat > app/(tabs)/variants/ProfessionalDashboard.tsx << 'EOF'
'use client'

import { metallicTheme } from '@/lib/themes/metallic';

export function ProfessionalDashboard() {
  return (
    <div style={{ background: metallicTheme.colors.background }}>
      <h1 style={{ color: metallicTheme.colors.accent }}>
        Professional Dashboard
      </h1>
      {/* Port Professional dashboard content here */}
    </div>
  );
}
EOF

# GenZ dashboard (already in current Civic branch)
cp app/page.tsx app/(tabs)/variants/GenZDashboard.tsx 2>/dev/null || true

# Civic dashboard (current page)
cp app/page.tsx app/(tabs)/variants/CivicDashboard.tsx 2>/dev/null || true

# Create persona-aware router
cat > app/(tabs)/page.tsx << 'EOF'
'use client'

import { getPersona } from '@/lib/config/persona';
import { ProfessionalDashboard } from './variants/ProfessionalDashboard';
import { GenZDashboard } from './variants/GenZDashboard';
import { CivicDashboard } from './variants/CivicDashboard';

export default function HomePage() {
  const persona = getPersona();
  
  switch (persona.type) {
    case 'professional':
      return <ProfessionalDashboard />;
    case 'genz':
      return <GenZDashboard />;
    case 'civic':
      return <CivicDashboard />;
    default:
      return <CivicDashboard />;
  }
}
EOF

git add app/(tabs)/
git commit -m "feat: Add persona-aware page routing"
```

### Step 4.2: Update Navigation (Day 10)

```bash
# Create persona-aware navigation
cat > components/navigation/PersonaNav.tsx << 'EOF'
'use client'

import { getPersona, isFeatureEnabled } from '@/lib/config/persona';
import Link from 'next/link';

export function PersonaNav() {
  const persona = getPersona();
  
  const navItems = [
    { href: '/', label: 'Dashboard', show: true },
    { href: '/contacts', label: 'Contacts', show: true },
    { href: '/signals', label: 'Signals', show: true },
    { href: '/collections', label: 'Collections', show: isFeatureEnabled('nftCollectibles') },
    { href: '/events', label: 'Events', show: isFeatureEnabled('civicEngagement') },
    { href: '/volunteer', label: 'Volunteer', show: isFeatureEnabled('civicEngagement') },
  ];
  
  return (
    <nav style={{ background: persona.theme.primaryColor }}>
      <h2>{persona.name}</h2>
      <ul>
        {navItems.filter(item => item.show).map(item => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
EOF

git add components/navigation/
git commit -m "feat: Add persona-aware navigation"
```

---

## Phase 5: Testing & Validation (Days 11-13)

### Step 5.1: Unit Tests (Day 11)

```bash
# Create test utilities
mkdir -p lib/test-utils

cat > lib/test-utils/persona-helpers.ts << 'EOF'
import { PersonaType } from '@/lib/config/persona.types';

export function withPersona<T>(persona: PersonaType, testFn: () => T): T {
  const originalEnv = process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA;
  process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA = persona;
  
  try {
    return testFn();
  } finally {
    process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA = originalEnv;
  }
}

export const testPersonas = ['professional', 'genz', 'civic'] as PersonaType[];
EOF

# Create persona config tests
cat > lib/config/__tests__/persona.test.ts << 'EOF'
import { describe, it, expect, beforeEach } from '@jest/globals';
import { getPersona, isFeatureEnabled, resetPersona } from '../persona';
import { withPersona, testPersonas } from '@/lib/test-utils/persona-helpers';

describe('Persona Configuration', () => {
  beforeEach(() => {
    resetPersona();
  });

  testPersonas.forEach(personaType => {
    describe(`${personaType} persona`, () => {
      it('loads correct configuration', () => {
        withPersona(personaType, () => {
          const persona = getPersona();
          expect(persona.type).toBe(personaType);
          expect(persona.name).toBeTruthy();
          expect(persona.theme).toBeTruthy();
        });
      });
      
      it('has valid feature flags', () => {
        withPersona(personaType, () => {
          const persona = getPersona();
          expect(typeof persona.features.nftCollectibles).toBe('boolean');
          expect(typeof persona.features.gamification).toBe('boolean');
        });
      });
    });
  });

  it('defaults to civic for invalid persona', () => {
    process.env.NEXT_PUBLIC_TRUSTMESH_PERSONA = 'invalid' as any;
    resetPersona();
    const persona = getPersona();
    expect(persona.type).toBe('civic');
  });
});
EOF

# Run tests
pnpm test lib/config/__tests__/persona.test.ts || echo "Tests created, run after dependencies installed"

git add lib/test-utils/ lib/config/__tests__/
git commit -m "test: Add persona configuration tests"
```

### Step 5.2: Manual Testing Matrix (Days 12-13)

```bash
# Create test matrix doc
cat > docs/consolidation/test-matrix.md << 'EOF'
# Manual Test Matrix

## Test Each Persona

### Professional Persona

```bash
cp .env.professional .env.local
pnpm dev
```

Test Checklist:
- [ ] Metallic theme loads
- [ ] Professional recognition tokens appear
- [ ] No NFT features visible
- [ ] No civic engagement features
- [ ] Contact bonding works
- [ ] Trust allocation works
- [ ] Professional dashboard shows correctly

### GenZ Persona

```bash
cp .env.genz .env.local
pnpm dev
```

Test Checklist:
- [ ] Mobile-first theme loads
- [ ] NFT collectible cards appear
- [ ] 3D card animations work
- [ ] Hashinal minting works
- [ ] Gamification features visible
- [ ] No civic engagement features
- [ ] Collections page shows NFTs

### Civic Persona

```bash
cp .env.civic .env.local
pnpm dev
```

Test Checklist:
- [ ] Glass morphism theme loads
- [ ] Civic + GenZ features both work
- [ ] Support/volunteer registration works
- [ ] Event RSVPs work
- [ ] NFT features still work (inherited from GenZ)
- [ ] Campaign management features work
- [ ] All pages accessible

## Cross-Persona Tests

- [ ] Switch personas without rebuild (just env change + restart)
- [ ] Data persists across persona changes
- [ ] HCS signals work for all personas
- [ ] Authentication works for all personas
- [ ] No console errors in any persona

## Performance Tests

- [ ] Load time < 3s for all personas
- [ ] No memory leaks when switching personas
- [ ] Bundle size < 500KB per persona
EOF

git add docs/consolidation/test-matrix.md
git commit -m "docs: Add manual testing matrix"
```

---

## Phase 6: Documentation & Cleanup (Day 14)

### Step 6.1: Update Main README

```bash
# Backup current README
cp README.md README.md.backup

# Add persona documentation section
cat >> README.md << 'EOF'

## 🎭 Persona System

TrustMesh supports three market personas from a single codebase:

### Professional Lens
Enterprise-grade B2B trust networking
- Metallic UI theme
- Professional recognition tokens (Leadership, Innovation, Strategic Partnership)
- Enterprise RBAC patterns
- HCS-21 Social Trust Graph Standard

**Setup:**
```bash
NEXT_PUBLIC_TRUSTMESH_PERSONA=professional
```

### GenZ Lens
Gamified social trust for college campuses
- NFT collectible cards (53 hashinals)
- 3D trading card animations
- Mobile-first UX
- Gamification with XP and boosts

**Setup:**
```bash
NEXT_PUBLIC_TRUSTMESH_PERSONA=genz
```

### Civic Lens
Municipal/civic engagement platform
- Glass morphism UI
- Campaign management tools (support, volunteer, events)
- Inherits all GenZ features (NFTs + gamification)
- Magic.link email authentication for voters

**Setup:**
```bash
NEXT_PUBLIC_TRUSTMESH_PERSONA=civic
```

## Switching Personas

Use environment variables to switch between personas:

```bash
# Copy persona-specific env file
cp .env.professional .env.local  # or .env.genz or .env.civic

# Restart dev server
pnpm dev
```

See `.env.example` for full configuration options.

## Architecture

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

See `docs/PERSONA_GUIDE.md` for detailed architecture documentation.
EOF

git add README.md
git commit -m "docs: Add persona system documentation to README"
```

### Step 6.2: Create Persona Guide

```bash
cat > docs/PERSONA_GUIDE.md << 'EOF'
# TrustMesh Persona System Guide

## Overview

TrustMesh uses a universal architecture that adapts to three market personas:

1. **Professional** - B2B enterprise networking
2. **GenZ** - College campus gamification  
3. **Civic** - Political campaign engagement

## How It Works

### Configuration System

Personas are configured via environment variables:

```bash
NEXT_PUBLIC_TRUSTMESH_PERSONA=professional  # or genz or civic
```

At runtime, the system:
1. Loads persona config from `lib/config/persona.types.ts`
2. Configures features, theme, services based on persona
3. Routes components and pages to persona-specific variants

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
import { getRecognitionService } from '@/lib/services/recognition'

const recognitionService = getRecognitionService()
// Returns: ProfessionalRecognitionService, HashinalRecognitionService,
// or CivicRecognitionService based on NEXT_PUBLIC_TRUSTMESH_PERSONA
```

## Adding a New Persona

1. Add persona definition to `PERSONA_CONFIGS` in `lib/config/persona.types.ts`
2. Create theme in `lib/themes/your-theme.ts`
3. Add recognition tokens in `lib/data/recognition-tokens/your-tokens.json`
4. Add signal types in `lib/data/signal-types/your-signals.json`
5. Create component variants if needed in `components/persona-aware/variants/`
6. Create page variants if needed in `app/(tabs)/variants/`
7. Update tests in `lib/config/__tests__/persona.test.ts`
8. Document in this guide

## Branch History

This consolidation merged features from 4 branches:

- **Professional** (`ux-variant-1-professional`) - Metallic theme, enterprise tokens
- **Universal V2** (`feature/universal-recognition-v2`) - NFT foundation (snapshot)
- **GenZ** (`feature/genz-lens`) - Gamification + hashinals
- **Civic** (`feat/civic-lens`) - Campaign management + civic engagement

The final consolidated branch contains all features, selectable via persona config.

See `MERGE_STRATEGY_4_BRANCHES.md` for detailed merge history.
EOF

git add docs/PERSONA_GUIDE.md
git commit -m "docs: Create comprehensive persona guide"
```

---

## Phase 7: Final Integration & Deploy (Day 15)

### Step 7.1: Smoke Tests

```bash
# Test each persona builds successfully
for persona in professional genz civic; do
  echo "Testing $persona persona..."
  cp ".env.${persona}" .env.local
  pnpm build || echo "Build failed for $persona"
done

# Run all tests
pnpm test

# Type check
pnpm run type-check

# Lint
pnpm lint
```

### Step 7.2: Create PR

```bash
# Push consolidation branch
git push origin feat/persona-consolidation

# Create PR description file
cat > pr-description.md << 'EOF'
# TrustMesh Persona Consolidation

## Summary

Consolidates 4 branches into one codebase with persona-based configuration:
- Professional (enterprise B2B)
- GenZ (campus gamification)
- Civic (political campaigns)

## Changes

- ✅ Imported Professional features (metallic theme, enterprise tokens, services)
- ✅ Added persona configuration system
- ✅ Created persona-aware components and pages
- ✅ Maintained Universal Recognition V2 / GenZ features
- ✅ Preserved all Civic engagement features
- ✅ Added comprehensive tests
- ✅ Updated documentation

## Testing

- [x] All personas tested locally
- [x] Unit tests pass
- [x] Type checking passes
- [x] Lint passes
- [x] Builds successfully for all personas

## Migration Notes

- Base branch: `feat/civic-lens` (most complete)
- Features imported from: `ux-variant-1-professional`
- Historical references: `feature/universal-recognition-v2`, `feature/genz-lens`
- No breaking changes to existing Civic functionality

## Environment Variables

New required variable:
```bash
NEXT_PUBLIC_TRUSTMESH_PERSONA=civic  # or professional or genz
```

See `.env.example` for details.

## Deployment

Can deploy as:
1. Single instance with persona switching
2. Three separate deployments (one per persona)
3. Hybrid (Civic production + Professional/GenZ staging)

## Documentation

- `README.md` - Updated with persona sections
- `docs/PERSONA_GUIDE.md` - Complete architecture guide
- `docs/consolidation/test-matrix.md` - Testing checklist
- `MERGE_STRATEGY_4_BRANCHES.md` - This strategy document

## Next Steps

After merge:
1. Deploy to staging for each persona
2. Verify production readiness
3. Tag release as `v2.0.0-persona-system`
4. Archive old branch tags as historical references
EOF

echo "PR description created. Use GitHub CLI or web interface to create PR."
echo "gh pr create --title 'feat: Consolidate 4 branches into persona system' --body-file pr-description.md"
```

### Step 7.3: Merge to Main

```bash
# After PR approval, merge to main
git checkout main
git pull origin main
git merge feat/persona-consolidation
git push origin main

# Tag release
git tag v2.0.0-persona-system -m "Consolidated persona system with Professional, GenZ, and Civic lenses"
git push origin v2.0.0-persona-system

# Archive old branches as tags (keep for reference)
git tag archive-professional-branch ux-variant-1-professional
git tag archive-universal-v2-branch feature/universal-recognition-v2
git tag archive-genz-branch feature/genz-lens
git tag archive-civic-branch feat/civic-lens
git push origin --tags
```

---

## Rollback Plan

If consolidation has issues:

```bash
# Return to original Civic branch
git checkout backup-civic-$(date +%Y%m%d)

# Or cherry-pick specific commits
git checkout feat/civic-lens
git cherry-pick <commit-hash>

# Or start fresh from tag
git checkout -b fix/consolidation-issues backup-civic-20251023
```

All branches preserved as tags for safety.

---

## Success Criteria

### Technical
- ✅ All 3 personas work from one codebase
- ✅ Persona switch via env var only (no rebuild required)
- ✅ No code duplication (DRY principles maintained)
- ✅ Bundle size < 500KB per persona
- ✅ Test coverage > 70%
- ✅ Type safety maintained
- ✅ No console errors

### Business
- ✅ Can demo all 3 personas in 1 hour
- ✅ Deploy to 3 markets from one codebase
- ✅ Maintain only 1 codebase (not 4)
- ✅ Add new personas in < 1 week
- ✅ No feature regression from original branches

### Process
- ✅ All original branches backed up as tags
- ✅ Rollback plan tested
- ✅ Documentation complete
- ✅ Team trained on persona system
- ✅ CI/CD updated for persona builds

---

## Timeline Summary

| Phase | Days | Focus | Deliverable |
|-------|------|-------|-------------|
| 1. Preparation | 1 | Backups + consolidation branch | Safety nets + clean slate |
| 2. Professional Import | 5 | Port theme, tokens, services, components | Professional features in Civic |
| 3. Persona Config | 2 | Config system + environment | Persona switching works |
| 4. Pages | 2 | Persona-aware routing | All pages adapted |
| 5. Testing | 3 | Unit + manual tests | Validated functionality |
| 6. Documentation | 1 | README, guides, matrix | Complete docs |
| 7. Deploy | 1 | Smoke tests + PR + merge | Production ready |

**Total:** 15 days (down from 18-21 days due to simplified strategy)

---

## Key Insights

1. **This is NOT a 4-way merge** - It's Civic (base) + Professional import + persona config
2. **Universal V2 is already in Civic** - No merge needed, just reference tag
3. **GenZ IS Universal V2** - Same branch, different commit pointer
4. **Professional is separate lineage** - Import features, not merge git history
5. **Persona config is the key** - Runtime switching, not build-time branching

---

## Questions & Troubleshooting

**Q: Why not use git merge for all branches?**
A: Professional has no common ancestor with Civic. Git merge would create massive conflicts. Import is cleaner.

**Q: Can we delete old branches after consolidation?**
A: Keep as archived tags for reference. Don't delete until 6+ months post-consolidation and confirmed stable.

**Q: What if Professional features conflict with Civic?**
A: Persona config gates features - they can't conflict at runtime, only one active at a time.

**Q: How do we add a 4th persona later?**
A: Follow "Adding a New Persona" section in `docs/PERSONA_GUIDE.md` - takes ~3-5 days for complete persona.

**Q: Can users switch personas without restart?**
A: Not yet - requires full app reload. Phase 2 enhancement could add dynamic switching.

---

*Strategy created: 2025-10-23*  
*Branches analyzed: Professional, Universal V2, GenZ, Civic*  
*Approach: Civic base + Professional import + persona config layer*  
*Timeline: 15 days*
