# TrustMesh Patterns Documentation
**Cross-Version Architecture Patterns & Implementation Guide**

## Overview
This document captures the core patterns, architectures, and implementation strategies developed in TrustMesh that can be adapted across different versions (Professional, GenZ, Enterprise, etc.). It serves as the definitive guide for maintaining consistency while allowing version-specific customization.

---

## 🏗️ Core Architecture Patterns

### 1. **HCS Multi-Topic Architecture**
**Pattern:** Separate topics for different data types enable parallel processing and domain separation.

```typescript
// Topic Registry Pattern
const TOPIC_REGISTRY = {
  CONTACTS: "0.0.XXXXXX",     // Contact requests/accepts
  TRUST: "0.0.XXXXXX",        // Trust allocations/revocations
  PROFILE: "0.0.XXXXXX",      // User profile data
  RECOGNITION: "0.0.XXXXXX",  // Achievement tokens
  FEED: "0.0.XXXXXX"         // General activity feed
}
```

**Benefits:**
- Domain separation and scaling
- Parallel processing capabilities
- Topic-specific governance models
- Granular access control

**Adaptability:** Can be collapsed to single topic for simpler deployments or expanded for enterprise scale.

### 2. **Message Envelope Pattern (HCS-21)**
**Pattern:** Standardized envelope structure with backward compatibility.

```typescript
// HCS-21 Standard Envelope
interface HCS21Envelope {
  hcs: "21"                    // Standard identifier
  v: "1.0"                     // Version for evolution
  type: number                 // Enum for cost optimization
  from: string                 // Actor identifier
  nonce: number               // Replay protection
  ts: number                  // Unix timestamp
  payload: Record<string, any> // Event-specific data
}

// Legacy Envelope (maintained for compatibility)
interface LegacyEnvelope {
  type: string                // String-based type
  from: string               // Actor identifier  
  nonce: number             // Replay protection
  ts: number               // Unix timestamp
  payload: Record<string, any> // Event-specific data
}
```

**Benefits:**
- Cost optimization (7-16% smaller messages)
- Version-aware evolution
- Backward compatibility
- Standards compliance

**Adaptability:** Version field allows format evolution, enum mappings can be customized per use case.

### 3. **Signal Normalization Pattern**
**Pattern:** Convert all message formats to unified `SignalEvent` structure for UI consistency.

```typescript
interface SignalEvent {
  id: string                    // Unique identifier
  type: string                  // Normalized type string
  actor: string                 // Who performed action
  target?: string               // Optional recipient
  ts: number                   // Timestamp in milliseconds
  topicId: string              // Source topic
  metadata: Record<string, any> // Payload data
  source: 'hcs' | 'hcs-cached' // Data provenance
}
```

**Benefits:**
- UI components see consistent data structure
- Multiple message formats supported seamlessly
- Easy to add new message sources
- Clean separation of concerns

**Adaptability:** Metadata field can accommodate any payload structure, type field can map to version-specific events.

---

## 🔄 Data Flow Patterns

### 1. **Submit → Route → Store → Ingest → Normalize → Process**

```typescript
// 1. Submit: API accepts multiple formats
POST /api/hcs/submit
{
  // Legacy OR HCS-21 format
}

// 2. Route: Direct to appropriate topic
function routeTopicByEnvelope(body, topics) {
  if (body?.hcs === "21") {
    // HCS-21 enum routing
    return routeByEnum(body.type, topics)
  }
  // Legacy string routing
  return routeByString(body.type, topics)
}

// 3. Store: Hedera Consensus Service
await submitToTopic(topicId, message)

// 4. Ingest: Mirror Node → Normalizer
const messages = await backfillFromRest(topicId, limit)

// 5. Normalize: Multiple formats → SignalEvent
const events = messages.map(normalizeHcsMessage)

// 6. Process: Business logic & UI updates
const stats = getTrustStatsFromHCS(events, sessionId)
```

**Benefits:**
- Clean separation of concerns
- Multiple input formats supported
- Scalable processing pipeline
- Easy to add new steps

**Adaptability:** Each step can be customized per version while maintaining interface contracts.

### 2. **State Derivation Pattern**
**Pattern:** Derive current state from immutable event log rather than storing mutable state.

```typescript
// Event Sourcing Pattern
function getTrustStatsFromHCS(events: SignalEvent[], sessionId: string) {
  // Filter relevant events
  const trustEvents = events.filter(e => 
    (e.type === 'TRUST_ALLOCATE' || e.type === 'TRUST_REVOKE') &&
    e.actor === sessionId
  )
  
  // Process chronologically
  const trustByPeer = new Map()
  for (const event of trustEvents.sort((a, b) => a.ts - b.ts)) {
    if (event.type === 'TRUST_ALLOCATE') {
      trustByPeer.set(event.target, event.metadata.weight)
    } else if (event.type === 'TRUST_REVOKE') {
      trustByPeer.delete(event.target)
    }
  }
  
  // Calculate current state
  return {
    allocatedOut: Array.from(trustByPeer.values()).reduce((a, b) => a + b, 0),
    cap: 9 // Business rule
  }
}
```

**Benefits:**
- Immutable audit trail
- Time-travel debugging
- Consistent state reconstruction
- No state synchronization issues

**Adaptability:** Business rules can be customized per version while maintaining event processing pattern.

---

## 🎨 UI/UX Patterns

### 1. **Mobile-First Component Architecture**
**Pattern:** Components designed for mobile constraints but scale up to desktop.

```typescript
// Base Mobile Layout
const MobileContainer = ({ children }) => (
  <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    {children}
  </div>
)

// Responsive Component Pattern
const CircleStats = ({ trustStats }) => (
  <div className="
    flex flex-col gap-4 p-6
    md:flex-row md:gap-8 md:p-8
    lg:gap-12 lg:p-12
  ">
    <StatCard 
      title={`${trustStats.allocatedOut}/${trustStats.maxSlots}`}
      subtitle="Trust Allocated"
      variant="primary"
    />
    <StatCard 
      title={trustStats.bondedContacts}
      subtitle="Bonded Contacts"
      variant="secondary" 
    />
  </div>
)
```

**Benefits:**
- Consistent mobile experience
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Performance optimized

**Adaptability:** Base components can be themed/styled per version (Professional, GenZ, Enterprise).

### 2. **Metallic Design System**
**Pattern:** Premium visual language using gradients, shadows, and metallic effects.

```css
/* Core Color Palette */
:root {
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --metallic-gold: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  --metallic-silver: linear-gradient(135deg, #c0c0c0 0%, #808080 100%);
  --glass-effect: backdrop-blur(12px) saturate(180%);
}

/* Component Pattern */
.metallic-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: var(--glass-effect);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}
```

**Benefits:**
- Premium, modern aesthetic
- Consistent visual language
- High perceived value
- Brand differentiation

**Adaptability:** Color schemes and effects can be adjusted per target demographic (Professional = subtle, GenZ = vibrant).

### 3. **Progressive Disclosure Pattern**
**Pattern:** Show information in digestible chunks with drill-down capabilities.

```typescript
// Summary → Detail Pattern
const TrustOverview = () => (
  <div className="space-y-4">
    {/* High-level summary */}
    <TrustStats summary />
    
    {/* Expandable details */}
    <Collapsible title="Trust Breakdown">
      <TrustLevelsList detailed />
    </Collapsible>
    
    {/* Modal for deep details */}
    <Modal trigger="View All Allocations">
      <TrustAllocationHistory />
    </Modal>
  </div>
)
```

**Benefits:**
- Reduced cognitive load
- Mobile-friendly information hierarchy
- Flexible information density
- User-controlled detail level

**Adaptability:** Disclosure levels can be adjusted per user sophistication (GenZ = more visual, Professional = more data).

---

## ⚡ Performance Patterns

### 1. **Optimistic UI Updates**
**Pattern:** Update UI immediately, rollback if operation fails.

```typescript
const useOptimisticTrustAllocation = () => {
  const [trustStats, setTrustStats] = useState(initialStats)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const allocateTrust = async (target: string, weight: number) => {
    // Optimistic update
    const optimisticStats = {
      ...trustStats,
      allocatedOut: trustStats.allocatedOut + weight
    }
    setTrustStats(optimisticStats)
    setIsSubmitting(true)
    
    try {
      await submitTrustAllocation(target, weight)
      // Success - optimistic update was correct
    } catch (error) {
      // Rollback optimistic update
      setTrustStats(trustStats)
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return { trustStats, allocateTrust, isSubmitting }
}
```

**Benefits:**
- Immediate user feedback
- Perceived performance improvement
- Better mobile experience
- Graceful error handling

**Adaptability:** Can be applied to any state-changing operation across versions.

### 2. **Smart Caching Pattern**
**Pattern:** Cache expensive operations with intelligent invalidation.

```typescript
// Multi-layer caching
const useCachedCircleData = (sessionId: string) => {
  // 1. Memory cache (React state)
  const [cachedData, setCachedData] = useState(null)
  
  // 2. Local storage cache
  const cacheKey = `circle-${sessionId}-${format(new Date(), 'yyyy-MM-dd-HH')}`
  
  // 3. Server-side cache (API level)
  const fetchCircleData = useCallback(async () => {
    // Check local storage first
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        return parsed.data
      }
    }
    
    // Fetch fresh data
    const fresh = await fetch('/api/circle').then(r => r.json())
    
    // Update caches
    localStorage.setItem(cacheKey, JSON.stringify({
      data: fresh,
      timestamp: Date.now()
    }))
    setCachedData(fresh)
    
    return fresh
  }, [sessionId, cacheKey])
  
  return { data: cachedData, fetch: fetchCircleData }
}
```

**Benefits:**
- Reduced API calls
- Better mobile performance
- Offline capability foundation
- Cost optimization

**Adaptability:** TTL and cache strategies can be tuned per version/use case.

---

## 🔐 Security & Trust Patterns

### 1. **Cryptographic Integrity Pattern**
**Pattern:** Every message signed and verifiable on immutable ledger.

```typescript
// Message signing pattern
interface SignedMessage {
  envelope: HCS21Envelope
  signature: string        // Ed25519 signature
  publicKey: string       // Signer's public key
}

// Verification pattern
function verifyMessage(signed: SignedMessage): boolean {
  const messageHash = hash(JSON.stringify(signed.envelope))
  return verifySignature(
    messageHash,
    signed.signature, 
    signed.publicKey
  )
}
```

**Benefits:**
- Cryptographic message integrity
- Non-repudiation
- Tamper detection
- Trust verification

**Adaptability:** Signature algorithms can be upgraded while maintaining verification pattern.

### 2. **Trust Graph Validation Pattern**
**Pattern:** Multi-layer validation of trust relationships.

```typescript
// Trust validation layers
function validateTrustAllocation(allocation: TrustAllocation): ValidationResult {
  // 1. Format validation
  if (!isValidTrustFormat(allocation)) {
    return { valid: false, reason: 'Invalid format' }
  }
  
  // 2. Business rules validation
  if (allocation.weight > MAX_TRUST_WEIGHT) {
    return { valid: false, reason: 'Weight exceeds limit' }
  }
  
  // 3. Relationship validation
  if (!isBondedContact(allocation.from, allocation.target)) {
    return { valid: false, reason: 'Not bonded contacts' }
  }
  
  // 4. Capacity validation
  const currentAllocation = getTrustAllocated(allocation.from)
  if (currentAllocation + allocation.weight > TRUST_CAPACITY) {
    return { valid: false, reason: 'Trust capacity exceeded' }
  }
  
  return { valid: true }
}
```

**Benefits:**
- Multiple validation layers
- Clear error messaging
- Business rule enforcement
- Data integrity assurance

**Adaptability:** Validation rules can be customized per version while maintaining structure.

---

## 🚀 Deployment & Scaling Patterns

### 1. **Environment Configuration Pattern**
**Pattern:** Hierarchical configuration with environment-specific overrides.

```typescript
// Base configuration
const baseConfig = {
  topics: {
    contacts: process.env.NEXT_PUBLIC_TOPIC_CONTACT,
    trust: process.env.NEXT_PUBLIC_TOPIC_TRUST,
    profile: process.env.NEXT_PUBLIC_TOPIC_PROFILE,
    recognition: process.env.NEXT_PUBLIC_TOPIC_RECOGNITION
  },
  features: {
    hcs21: process.env.NEXT_PUBLIC_HCS21_ENABLED === 'true',
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
    genzMode: process.env.NEXT_PUBLIC_GENZ_MODE === 'true'
  }
}

// Version-specific overrides
const genzConfig = {
  ...baseConfig,
  ui: {
    theme: 'vibrant',
    animations: 'enhanced',
    socialFeatures: true
  }
}
```

**Benefits:**
- Environment-specific customization
- Feature flag control
- Easy A/B testing
- Progressive rollout capability

**Adaptability:** New versions can override specific sections while inheriting base functionality.

### 2. **Modular Feature Pattern**
**Pattern:** Features as composable modules that can be enabled/disabled.

```typescript
// Feature module pattern
interface FeatureModule {
  name: string
  version: string
  dependencies: string[]
  components: ComponentMap
  apis: APIEndpoint[]
  enabled: boolean
}

// Feature registry
const features = {
  trustAllocation: {
    name: 'Trust Allocation',
    version: '2.1.0',
    dependencies: ['contactBonding'],
    components: { TrustStatsCard, TrustAllocationModal },
    apis: ['/api/trust/allocate', '/api/trust/stats'],
    enabled: true
  },
  genzBoost: {
    name: 'GenZ Boost Features',
    version: '1.0.0', 
    dependencies: ['trustAllocation'],
    components: { VibesCard, BoostModal, TrendingFeed },
    apis: ['/api/genz/vibes', '/api/genz/boost'],
    enabled: process.env.NEXT_PUBLIC_FEATURE_GZ_BOOST === '1'
  }
}
```

**Benefits:**
- Modular architecture
- Version-specific features
- Clean dependency management
- Easy feature toggles

**Adaptability:** GenZ version can enable specific modules while maintaining core functionality.

---

## 📊 Analytics & Metrics Patterns

### 1. **Event-Driven Analytics Pattern**
**Pattern:** Track user interactions and system events for optimization.

```typescript
// Analytics event pattern
interface AnalyticsEvent {
  event: string                    // Action name
  userId: string                   // Actor
  timestamp: number               // When
  properties: Record<string, any>  // Context
  version: string                 // App version
}

// Usage pattern
const trackTrustAllocation = (allocation: TrustAllocation) => {
  track('trust_allocated', {
    userId: allocation.from,
    timestamp: Date.now(),
    properties: {
      target: allocation.target,
      weight: allocation.weight,
      category: allocation.category,
      messageFormat: 'hcs21' // or 'legacy'
    },
    version: process.env.NEXT_PUBLIC_APP_VERSION
  })
}
```

**Benefits:**
- Data-driven optimization
- Version performance comparison
- User behavior insights
- Feature adoption tracking

**Adaptability:** Event schema can include version-specific properties while maintaining core structure.

---

## 🔄 Migration Patterns

### 1. **Backward Compatibility Pattern**
**Pattern:** Support multiple versions simultaneously during transitions.

```typescript
// Version detection and handling
function processMessage(rawMessage: any): SignalEvent {
  // Detect message format
  if (rawMessage?.hcs === "21") {
    return processHCS21Message(rawMessage)
  } else if (rawMessage?.type) {
    return processLegacyMessage(rawMessage)
  } else {
    return processUnknownMessage(rawMessage)
  }
}

// Graceful degradation
function getFeatures(userAgent: string): FeatureSet {
  const baseFeatures = ['contactBonding', 'trustAllocation']
  
  if (supportsAdvancedFeatures(userAgent)) {
    return [...baseFeatures, 'genzBoost', 'premiumAnimations']
  }
  
  return baseFeatures
}
```

**Benefits:**
- Smooth migration path
- No breaking changes
- Progressive enhancement
- User choice in adoption

**Adaptability:** Can support multiple versions concurrently while migrating users gradually.

---

## 📝 Version Adaptation Guide

### For GenZ Version:
```typescript
// GenZ-specific customizations
const genzAdaptations = {
  // UI: More vibrant, animated, social
  theme: 'vibrant-metallic',
  animations: 'enhanced',
  
  // Messaging: Casual, emoji-rich
  copyTone: 'casual',
  emojiSupport: true,
  
  // Features: Social-first, gamification
  features: ['vibesScore', 'trustBoost', 'socialFeed'],
  
  // Performance: Optimized for mobile
  bundleSize: 'minimal',
  prefetch: 'aggressive'
}
```

### For Enterprise Version:
```typescript
// Enterprise-specific customizations  
const enterpriseAdaptations = {
  // UI: Professional, data-dense
  theme: 'professional-metallic',
  animations: 'subtle',
  
  // Features: Compliance, audit, bulk operations
  features: ['auditTrail', 'bulkOperations', 'complianceReports'],
  
  // Security: Enhanced validation, logging
  validation: 'strict',
  auditLevel: 'comprehensive'
}
```

---

## 🎯 Implementation Checklist

### Core Patterns (Required for all versions):
- [ ] HCS Multi-Topic Architecture
- [ ] Message Envelope Pattern (HCS-21)
- [ ] Signal Normalization Pattern
- [ ] State Derivation Pattern
- [ ] Mobile-First Components
- [ ] Performance Optimization

### Version-Specific Patterns (Customize as needed):
- [ ] Design System Adaptation
- [ ] Feature Module Selection
- [ ] Analytics Event Schema
- [ ] Migration Strategy
- [ ] Environment Configuration

### Quality Assurance:
- [ ] Backward Compatibility Testing
- [ ] Cross-Version Pattern Consistency
- [ ] Performance Benchmarking
- [ ] Security Validation

---

This patterns documentation provides the foundation for consistent implementation across TrustMesh versions while allowing for version-specific customization and optimization. Each pattern can be adapted to fit the target audience and use case while maintaining the core architectural benefits.

*Last Updated: October 13, 2025*  
*Next Review: Before GenZ version development*