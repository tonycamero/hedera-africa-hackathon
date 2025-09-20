# 🧬 TrustMesh Technical Overview

**Purpose**: Essential architecture knowledge for hackathon execution  
**Audience**: Development team quick reference  
**Reading Time**: 5 minutes

---

## ⚡ **Core Concept**

TrustMesh = **Bounded Dynamical System for Trust**
- **9 trust tokens max** per user (prevents complexity explosion)
- **3-layer trust architecture**: Contacts → Circle → Recognition  
- **HCS standards-based** for Hedera ecosystem interoperability
- **Context-driven** with real-time engagement loops

---

## 🏗️ **Architecture (5 Components)**

### **1. Profile Manager (HCS-11)**
```typescript
interface TrustMeshProfile {
  profileId: string;            // Hedera account ID
  displayName: string;
  circleOfTrust: {
    signalsGiven: TrustSignal[];
    signalsReceived: TrustSignal[];
    trustScore: number;         // 0-100 calculated score
  };
  badges: Badge[];
  visibility: 'public' | 'private';
}
```

### **2. Trust Token Manager (HCS-20)**
```typescript
interface TrustToken {
  tokenId: string;
  issuer: string;              // Who gives trust
  recipient: string;           // Who receives trust
  trustType: 'personal' | 'professional' | 'community';
  relationship: string;        // "helpful guide", "colleague"
  context?: string;            // Optional reason/story
  timestamp: string;
}
```

### **3. Signal Manager (HCS-5)**
```typescript
interface Signal {
  hashinalId: string;          // Unique Hedera NFT-like asset
  name: string;                // "Eco Helper", "Best Dressed"
  category: 'achievement' | 'personality' | 'skill';
  rarity: 'common' | 'rare' | 'legendary';
  issuedBy: string;
  issuedTo: string;
  visualIcon: string;          // Emoji or image URL
}
```

### **4. Reputation Engine (HCS-2)**
```typescript
// Reputation calculation
const calculateTrustScore = (profile: TrustMeshProfile) => {
  const trustWeight = profile.circleOfTrust.signalsReceived.length * 15;
  const signalWeight = profile.signals.reduce((sum, signal) => {
    return sum + RARITY_WEIGHTS[signal.rarity];
  }, 0);
  const activityWeight = getRecentActivity(profile.profileId) * 5;
  
  return Math.min(100, trustWeight + signalWeight + activityWeight);
};
```

### **5. Community Polls (HCS-8/9)**
```typescript
interface CommunityPoll {
  pollId: string;
  title: string;               // "Best Dressed at Fair"
  nominees: string[];          // User profile IDs
  votes: { [nominee: string]: number };
  endTime: string;
  winnerSignal?: Signal;       // Auto-awarded to winner
}
```

---

## 🔄 **Event Flow (Demo)**

```
1. QR Scan → Profile Creation (HCS-11)
    ↓
2. Meet Jordan → Give Trust Token (HCS-20)
    ↓  
3. Volunteer → Earn Signal (HCS-5)
    ↓
4. Vote in Poll → Community Engagement (HCS-8)
    ↓
5. Reputation Update → Milestone Unlock (HCS-2)
```

---

## 🎯 **Implementation Priorities**

### **MVP Sprint 1** *(Hours 0-6)*
1. Hedera SDK setup + testnet connection
2. HCS topic creation (5 topics)
3. Basic profile creation/storage
4. Simple trust token exchange

### **MVP Sprint 2** *(Hours 6-12)*
1. Signal creation and issuance
2. Basic reputation calculation  
3. Simple React UI for core flows
4. Mobile-responsive layout

### **Demo Sprint** *(Hours 12-24)*
1. Campus scenario implementation
2. Demo data population
3. Real-time updates and celebrations
4. Performance optimization

---

## 📊 **Performance Targets**

- **Trust Token Exchange**: <3 seconds end-to-end
- **Signal Creation**: <2 seconds
- **Reputation Update**: <1 second
- **Mobile Load Time**: <2 seconds
- **Demo Scene Transitions**: <500ms

---

## 🚨 **Critical Success Factors**

### **Technical**
- **HCS Integration**: All 5 standards working smoothly
- **Real-time Updates**: Live demo with actual Hedera transactions
- **Mobile Experience**: Perfect phone demo (judges will test this)

### **Demo**
- **Compelling Narrative**: Trust programmability story
- **Live Interaction**: Real trust relationships during presentation
- **Performance**: No lag, no bugs, no "it works on my machine"

### **Competition**
- **Innovation Story**: First bounded trust system on blockchain
- **Academic Credibility**: Princeton computational trust theory
- **Ecosystem Value**: Framework other developers can use

---

## 🛠️ **Development Notes**

### **HCS Topics Setup**
```javascript
// Create 5 dedicated topics
const TOPICS = {
  PROFILES: await createTopic("TrustMesh-Profiles"),
  TRUST_TOKENS: await createTopic("TrustMesh-Trust"),  
  SIGNALS: await createTopic("TrustMesh-Signals"),
  REPUTATION: await createTopic("TrustMesh-Reputation"),
  POLLS: await createTopic("TrustMesh-Polls")
};
```

### **Error Handling**
```typescript
// Graceful degradation for demo reliability
const executeWithFallback = async (hcsOperation, mockData) => {
  try {
    return await hcsOperation();
  } catch (error) {
    console.warn('HCS operation failed, using mock:', error);
    return mockData;
  }
};
```

### **Demo Data**
```json
{
  "demoUsers": [
    { "name": "Alex Chen", "role": "new_student" },
    { "name": "Jordan Smith", "role": "cs_club_president" },
    { "name": "Casey Rodriguez", "role": "eco_organizer" }
  ],
  "demoSignals": [
    { "name": "Welcome Signal", "rarity": "common", "icon": "🎉" },
    { "name": "Eco Helper", "rarity": "rare", "icon": "🌱" },
    { "name": "Style Icon", "rarity": "legendary", "icon": "✨" }
  ]
}
```

---

**This is everything your team needs to execute. Focus on shipping working demo, not perfect code. Make trust visible! 🚀**
