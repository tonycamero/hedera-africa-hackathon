# GenZ Lens UX Unification Plan

## 🎯 Problem Statement

TrustMesh GenZ has **two distinct UX experiences** that need unification:

1. **Core App** (authenticated, tab-based) — `/signals`, `/contacts`, `/wallet`, `/circle`
2. **Viral Hooks** (public, hosted pages) — `/collections`, `/collections/[id]`, `/boost/[boostId]`

These experiences have different:
- Visual styles (authenticated app vs. public showcase)
- Navigation patterns (tabs vs. standalone pages)
- CTAs (internal actions vs. signup prompts)
- Design systems (GenZ design system vs. gradient cards)

---

## 📊 Current Workflow Map

### **Experience A: Core App (Authenticated)**

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATED APP                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Signals] → Send Props → Select Friend → Mint Signal      │
│     ↓                                                        │
│  View Recent Activity → See Sent Signals                    │
│     ↓                                                        │
│  Share Signal → Generates /boost/[id] link                  │
│                                                              │
│  [Contacts] → Inner Circle (9 max) → Allocate Trust        │
│     ↓                                                        │
│  Add Friend → QR Scan / Profile Share                       │
│     ↓                                                        │
│  Share Profile → /u/[sessionId]                             │
│                                                              │
│  [Wallet] → View Collected Signals → Burn for TRST         │
│     ↓                                                        │
│  See Hashinals → 3D Card Gallery                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Design**:
- GenZ design system (`genZClassNames`, purple/cyan gradients)
- Tab navigation with persistent header
- Action-oriented (send props, add friends, allocate trust)
- Trust Agent lightning bolt prompts
- Mobile-first, touch-optimized (min-h-[44px])

---

### **Experience B: Viral Hooks (Public)**

```
┌─────────────────────────────────────────────────────────────┐
│                   PUBLIC VIRAL PAGES                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /collections → Gallery of 53 Recognition Cards             │
│     ↓                                                        │
│  Filter by Category (Social, Academic, Professional)        │
│     ↓                                                        │
│  Click Card → Modal Detail View                             │
│     ↓                                                        │
│  CTA: "Create Account & Start Sending" → /signup            │
│                                                              │
│  /collections/[id] → Single Card Hosted Page                │
│     ↓                                                        │
│  Share Button → Copy Link → Viral Distribution              │
│     ↓                                                        │
│  "View Full Collection" CTA → /collections                  │
│                                                              │
│  /boost/[boostId] → Viral Signal Boost Landing              │
│     ↓                                                        │
│  See Signal → Anonymous Boost OR Suggest                    │
│     ↓                                                        │
│  CTA: "Join TrustMesh" → /signup?intent=boost               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Design**:
- Standalone gradient pages (purple-900 → blue-900 → cyan-900)
- 3D card displays (`RecognitionCard3D`)
- Rarity system (Common → Legendary)
- No tab navigation (standalone pages)
- Heavy CTA emphasis (signup prompts)
- Stats display (total cards, god-tier, peak, heat)

---

## 🔥 Key Disconnects

### 1. **Visual Inconsistency**
- **Core App**: GenZ design system with `genZClassNames`, purple flame, lightning bolt motifs
- **Viral Pages**: Custom gradient system, rarity-based colors, 3D card transforms

### 2. **Navigation Patterns**
- **Core App**: Tab-based persistent nav, back buttons to dashboard
- **Viral Pages**: Standalone pages with "Back to Collections" or external links

### 3. **Data Flow**
- **Core App**: Real-time HCS data, user's own signals, contact graph
- **Viral Pages**: Static recognition token catalog, public display

### 4. **CTAs**
- **Core App**: "Send Props", "Add Friend", "Allocate Trust" (peer actions)
- **Viral Pages**: "Create Account & Start Sending" (acquisition CTAs)

### 5. **User Context**
- **Core App**: Personalized (session-aware, "Your Crew", trust levels)
- **Viral Pages**: Anonymous (showcases, no user context, generic CTAs)

---

## 🎨 Unification Strategy

### **Goal**: One cohesive GenZ experience where viral pages feel like natural extensions of the core app.

---

## 🛠️ Recommended Improvements

### **1. Unified Design System**

**Apply GenZ Design System to Viral Pages**

```tsx
// Current (viral pages)
<div className="bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">

// Unified (use GenZ theme)
<div className={genZClassNames.background}>
```

**Action Items**:
- Extract core app gradients into `lib/themes/genz-theme.ts`
- Replace hard-coded gradients in `/collections` and `/boost` with theme variables
- Use `GenZCard`, `GenZHeading`, `GenZButton` components consistently
- Add Trust Agent lightning bolt to viral pages (as "AI guide")

---

### **2. Contextual Navigation**

**Smart Nav That Adapts to Auth State**

```tsx
// Unified Navigation Component
<PersonaAwareNav>
  {isAuthenticated ? (
    <TabNav items={['Signals', 'Contacts', 'Wallet', 'Circle']} />
  ) : (
    <PublicNav items={['Collections', 'Join']} />
  )}
</PersonaAwareNav>
```

**Action Items**:
- Create `/components/navigation/AdaptiveNav.tsx`
- Show simplified nav on public pages (Collections, Boost pages)
- If logged in on viral page → show "Go to App" button
- If logged out on core pages → redirect to `/signup`

---

### **3. Viral Page Flow Improvements**

#### **A. Collections Page → App Integration**

**Current Problem**: Collections page is disconnected island with generic CTA.

**Fix**: Make it feel like an extension of `/wallet`

```tsx
// /collections/page.tsx (enhanced)
export default function CollectionsPage() {
  const { isAuthenticated, sessionId } = useSession()
  
  return (
    <div className={genZClassNames.background}>
      {isAuthenticated ? (
        // Logged-in view: "Your Collection" tab + "Browse All" tab
        <div>
          <TabNav active="browse" />
          <GenZHeading>All Recognition Cards</GenZHeading>
          <GenZText dim>Discover cards to send or collect</GenZText>
          <CardGallery showActions={true} /> {/* Send, Collect actions */}
        </div>
      ) : (
        // Public view: Showcase + CTA
        <div>
          <GenZHeading>Recognition Cards</GenZHeading>
          <GenZText dim>53 GenZ signals as collectible hashinals</GenZText>
          <CardGallery showActions={false} />
          <CTASection />
        </div>
      )}
    </div>
  )
}
```

**Benefits**:
- Logged-in users see actionable cards (send, collect)
- Public users see showcase + signup prompt
- Consistent design between states

---

#### **B. Single Card Page → Shareable + Actionable**

**Current Problem**: `/collections/[id]` is just a static showcase.

**Fix**: Add context-aware actions

```tsx
// /collections/[id]/page.tsx (enhanced)
export default function CardDetailPage() {
  const { isAuthenticated } = useSession()
  
  return (
    <div className={genZClassNames.background}>
      <RecognitionCard3D signal={signal} />
      
      {isAuthenticated ? (
        // Logged-in actions
        <div className="mt-6 space-y-3">
          <GenZButton variant="boost" onClick={handleSendToFriend}>
            Send to Friend
          </GenZButton>
          <GenZButton variant="primary" onClick={handleCollect}>
            Add to Wallet
          </GenZButton>
          <GenZButton variant="secondary" onClick={handleShare}>
            Share Card
          </GenZButton>
        </div>
      ) : (
        // Public CTA
        <div className="mt-6">
          <GenZButton variant="boost" onClick={() => router.push('/signup?card=' + signalId)}>
            Create Account to Send
          </GenZButton>
          <GenZText dim className="mt-2 text-center">
            Join to collect and send recognition cards
          </GenZText>
        </div>
      )}
    </div>
  )
}
```

**Benefits**:
- Authenticated users can take action immediately
- Public users see value prop + clear CTA
- Shared links drive signup with intent (`?card=networking`)

---

#### **C. Boost Page → Viral Loop with Context**

**Current Problem**: `/boost/[boostId]` is generic landing page.

**Fix**: Show signal context + personalized CTA

```tsx
// /boost/[boostId]/page.tsx (enhanced)
export default function BoostPage({ boostId }) {
  const { isAuthenticated, sessionId } = useSession()
  const signal = useSignalData(boostId)
  
  return (
    <div className={genZClassNames.background}>
      {/* Show original signal with sender context */}
      <GenZCard variant="glass">
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={signal.sender.avatar} />
          <div>
            <GenZText weight="semibold">{signal.sender.name}</GenZText>
            <GenZText size="sm" dim>sent {signal.name}</GenZText>
          </div>
        </div>
        
        <RecognitionCard3D signal={signal} compact />
        
        <GenZText dim className="mt-3">
          "{signal.message}"
        </GenZText>
      </GenZCard>
      
      {isAuthenticated ? (
        // Logged-in: Boost or Suggest
        <div className="mt-6 space-y-3">
          <GenZButton variant="boost" glow onClick={handleBoost}>
            <Zap className="w-4 h-4 mr-2" />
            Boost (Anonymous)
          </GenZButton>
          <GenZButton variant="secondary" onClick={handleSuggest}>
            <Share2 className="w-4 h-4 mr-2" />
            Suggest to Friend
          </GenZButton>
        </div>
      ) : (
        // Public: Join to participate
        <div className="mt-6">
          <GenZButton variant="boost" glow onClick={() => router.push('/signup?boost=' + boostId)}>
            Join to Boost This Signal
          </GenZButton>
          <GenZText dim className="mt-2 text-center">
            {signal.boosts} people have boosted this
          </GenZText>
        </div>
      )}
    </div>
  )
}
```

**Benefits**:
- Shows **who sent** the signal (social proof)
- Authenticated users can **act immediately** (boost/suggest)
- Public users see **participation count** (FOMO)
- Clear signup intent tracking (`?boost=xyz`)

---

### **4. Cross-Experience Data Sync**

**Problem**: Viral pages use static JSON, core app uses HCS.

**Fix**: Unified data layer

```tsx
// lib/services/RecognitionDataService.ts
export class RecognitionDataService {
  // Public catalog (viral pages)
  async getPublicCatalog(): Promise<SignalType[]> {
    return fetch('/api/recognition-tokens/public').then(r => r.json())
  }
  
  // User's collection (core app)
  async getUserCollection(sessionId: string): Promise<SignalAsset[]> {
    return hcsAssetCollection.getUserCollection(sessionId)
  }
  
  // Single card (works for both)
  async getCardDetail(cardId: string, sessionId?: string): Promise<CardDetail> {
    const card = await fetch(`/api/recognition/${cardId}`).then(r => r.json())
    
    if (sessionId) {
      // Add user context (do they own it, have they sent it, etc.)
      card.userContext = await this.getUserCardContext(sessionId, cardId)
    }
    
    return card
  }
}
```

**Benefits**:
- Single source of truth for card data
- Seamless transition between public/auth experiences
- Personalized overlays on public content when logged in

---

### **5. Onboarding Bridge**

**Problem**: New users from viral links land on generic signup.

**Fix**: Intent-aware onboarding

```tsx
// /signup/page.tsx
export default function SignupPage({ searchParams }) {
  const intent = searchParams.intent // 'boost', 'card', 'profile'
  const targetId = searchParams.boost || searchParams.card || searchParams.profile
  
  return (
    <div className={genZClassNames.background}>
      <GenZHeading>Join TrustMesh</GenZHeading>
      
      {intent === 'boost' && (
        <GenZText className="mb-6">
          Sign up to boost this signal and start building your crew ⚡
        </GenZText>
      )}
      
      {intent === 'card' && (
        <div className="mb-6">
          <GenZText className="mb-2">Sign up to collect this card:</GenZText>
          <RecognitionCard3D signal={targetCard} compact />
        </div>
      )}
      
      <SignupForm intent={intent} onComplete={() => handlePostSignup(intent, targetId)} />
    </div>
  )
}

function handlePostSignup(intent, targetId) {
  if (intent === 'boost') router.push(`/boost/${targetId}?action=boost`)
  if (intent === 'card') router.push(`/wallet?new=${targetId}`)
  // etc.
}
```

**Benefits**:
- Contextual signup (users remember why they're signing up)
- Immediate action after signup (complete the viral loop)
- Higher conversion (intent-driven vs. generic)

---

## 📐 Design System Consolidation

### **Create Unified Theme**

```tsx
// lib/themes/genz-unified.ts
export const genzTheme = {
  // Core gradients
  backgrounds: {
    app: 'bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900',
    appInk: 'bg-ink', // authenticated app background
    card: 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20',
    boost: 'bg-gradient-to-r from-boost-500/10 to-pri-500/10'
  },
  
  // Consistent spacing
  spacing: {
    pageX: 'px-4',
    pageY: 'py-6',
    cardPadding: 'p-4',
    minTouchTarget: 'min-h-[44px]'
  },
  
  // Typography
  typography: {
    h1: 'text-2xl sm:text-3xl font-extrabold text-white tracking-tight',
    h2: 'text-xl sm:text-2xl font-bold text-white',
    body: 'text-base text-purple-200',
    caption: 'text-sm text-purple-300'
  },
  
  // Actions
  cta: {
    primary: 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600',
    boost: 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600',
    secondary: 'bg-white/10 hover:bg-white/20'
  }
}
```

---

## 🚦 Implementation Phases

### **Phase 1: Visual Consistency** (2-3 hours)
- [ ] Extract theme into `lib/themes/genz-unified.ts`
- [ ] Replace hard-coded gradients in `/collections` with theme classes
- [ ] Replace hard-coded gradients in `/boost` with theme classes
- [ ] Apply `GenZHeading`, `GenZText`, `GenZButton` to viral pages

### **Phase 2: Navigation Unity** (2 hours)
- [ ] Create `AdaptiveNav` component
- [ ] Add simplified nav to `/collections` (Collections, Join)
- [ ] Add "Go to App" button for logged-in users on viral pages
- [ ] Add "Browse All Cards" link in `/wallet` → `/collections`

### **Phase 3: Contextual Actions** (3-4 hours)
- [ ] Add auth checks to `/collections` → show Send/Collect buttons when logged in
- [ ] Enhance `/collections/[id]` with actionable CTAs
- [ ] Update `/boost/[boostId]` to show sender context + logged-in actions
- [ ] Add boost count / social proof to boost pages

### **Phase 4: Data Unification** (2 hours)
- [ ] Create `RecognitionDataService` with public + auth methods
- [ ] Update viral pages to use unified service
- [ ] Add user context overlays on public content when logged in

### **Phase 5: Onboarding Bridge** (2 hours)
- [ ] Add intent tracking to all viral CTAs (`?intent=boost`, `?card=xyz`)
- [ ] Update `/signup` to show context-aware messaging
- [ ] Add post-signup redirect logic to complete viral loops

---

## 🎯 Success Metrics

### **Before** (Current State)
- Collections page: 0% authenticated engagement (CTA only)
- Boost page: Generic landing, no sender context
- Viral → App: 2-click gap (signup → navigate to feature)

### **After** (Unified State)
- Collections page: 100% functional for both auth states
- Boost page: Shows social proof + immediate actions
- Viral → App: 0-click (direct action post-signup)

### **KPIs to Track**
- **Viral Conversion**: % of viral page visitors who sign up
- **Intent Completion**: % who complete post-signup action (boost, collect)
- **Authenticated Engagement**: % of logged-in users who interact with viral pages
- **Cross-Experience Flow**: % who navigate between core app ↔ viral pages

---

## 📝 Paychex-Style Best Practices (Applied)

Based on external context about Paychex patterns:

### **1. Role-Based Views**
- ✅ **Applied**: Authenticated vs. Public views with different CTAs/actions
- 🎯 **Next**: Add "Collector" vs. "Sender" modes in `/collections`

### **2. Guided Flows**
- ✅ **Applied**: Trust Agent lightning bolt prompts in core app
- 🎯 **Next**: Add wizard flow for first-time viral users (Welcome → Pick Card → Send)

### **3. Contextual Alerts**
- ✅ **Applied**: Toast notifications for signal sent, boost completed
- 🎯 **Next**: Add "You have 3 new boosts!" notification in `/signals`

### **4. Analytics/Insights**
- ✅ **Applied**: Stats dashboard in `/collections` (Total, God-Tier, Peak, Heat)
- 🎯 **Next**: Add "Your Collection Value" score, "Rare Cards Unlocked" achievements

---

## 🎬 Example User Journeys (After Unification)

### **Journey 1: Viral Discovery → Collector**
1. User clicks shared `/collections/networking` link
2. Sees networking card + "53 others available"
3. Clicks "Create Account to Collect"
4. Signs up with intent=`card:networking`
5. Immediately lands in `/wallet` with networking card added
6. Sees "Browse All Cards" CTA → goes to `/collections` (now shows Send/Collect buttons)
7. Becomes active collector

### **Journey 2: Boost Participation → Sender**
1. User clicks `/boost/abc123` link from friend
2. Sees signal from @alex with 47 boosts
3. Clicks "Join to Boost This Signal"
4. Signs up with intent=`boost:abc123`
5. Immediately presented with Boost modal → completes boost
6. Sees "Want to send your own signal?" → goes to `/signals`
7. Becomes active sender

### **Journey 3: Authenticated User → Viral Sharer**
1. User in `/signals` sends "Networking Goat" to friend
2. Clicks Share → generates `/boost/xyz789`
3. Shares link on social media
4. Friend clicks → sees full signal context
5. Friend signs up → boosts signal
6. Original user gets notification in app
7. Viral loop complete

---

## 🔥 Quick Wins (Can Ship Today)

### **1. Add GenZ Theme to Collections** (30 min)
```tsx
// app/collections/page.tsx
- <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
+ <div className={genZClassNames.background}>
```

### **2. Add "Go to App" Button** (15 min)
```tsx
// app/collections/page.tsx
{isAuthenticated && (
  <GenZButton variant="boost" onClick={() => router.push('/signals')}>
    <Zap className="w-4 h-4 mr-2" />
    Go to App
  </GenZButton>
)}
```

### **3. Show Sender on Boost Pages** (45 min)
```tsx
// app/boost/[boostId]/page.tsx
<GenZCard>
  <Avatar src={signal.sender.avatar} />
  <GenZText>{signal.sender.name} sent {signal.name}</GenZText>
  <RecognitionCard3D signal={signal} />
</GenZCard>
```

---

## 📚 Related Files to Update

### **Core Components**
- `lib/themes/genz-theme.ts` (create)
- `components/navigation/AdaptiveNav.tsx` (create)
- `lib/services/RecognitionDataService.ts` (create)

### **Viral Pages**
- `app/collections/page.tsx` (unify design, add auth logic)
- `app/collections/[id]/page.tsx` (add actions)
- `app/boost/[boostId]/page.tsx` (add context, sender info)

### **Core App Pages**
- `app/(tabs)/wallet/page.tsx` (add link to `/collections`)
- `app/(tabs)/signals/page.tsx` (add boost notification)
- `app/signup/page.tsx` (add intent-aware onboarding)

---

**Status**: Ready for implementation  
**Effort**: 12-15 hours total across 5 phases  
**Impact**: Seamless GenZ experience, higher viral conversion, unified brand
