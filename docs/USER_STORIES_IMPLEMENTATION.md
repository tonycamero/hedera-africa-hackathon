# 🎯 TrustMesh User Stories - Implementation Guide

> **Focused on Contacts, Circle, and Signals with Implementation Priorities**

Based on external context analysis, these stories integrate perfectly with the **ContextEngine** architecture and **bounded trust dynamics** that define TrustMesh.

---

## 🔄 **The Three Activity Loops**

### **Loop 1: Contacts Loop** 🤝
Building and managing contacts with verification details, mutuals, and fresh connections feed

### **Loop 2: Circle Loop** 🔄  
Forming bounded trust relationships (9-token limit) with intentional economic backing

### **Loop 3: Signals Loop** 🏆
Earning and showcasing recognition tokens that enhance reputation and network value

---

## 🚀 **Priority 1: Demo Stories (Must Build for Hackathon)**

*Timeline: 5-minute demo flow - Add contact (30s), allocate to circle (90s), earn signal (90s), review updates (60s)*

### **Story 1.1: Add and Verify Contacts** 🤝
**Activity Loop**: Contacts Loop  
**User Story**: As a new user, I want to add contacts with verification details like mutuals and timestamps so that I can build my network and see them in the fresh connections feed.

**Implementation Phase**: Phase 1 (core flow)  
**Success Metrics**:
- Technical: <5s addition, real-time update
- UX: Simple search/add interface
- Judge Impact: Wow factor in verifiable contacts, differentiates accessibility

#### **Technical Implementation**
```typescript
// components/contacts/ContactsManager.tsx
export function ContactsManager() {
  const { user, magicClient } = useTrustMeshAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [freshConnections, setFreshConnections] = useState<Contact[]>([]);

  const addContact = async (contactData: ContactData) => {
    // Verify contact through Magic.link + Hedera lookup
    const contactProfile = await magicClient.getProfile(contactData.hederaAccountId);
    
    // Calculate mutual connections
    const mutuals = await calculateMutualConnections(user.hederaAccountId, contactData.hederaAccountId);
    
    const newContact: Contact = {
      ...contactData,
      mutuals: mutuals.count,
      mutualsList: mutuals.list,
      addedAt: new Date().toISOString(),
      verificationStatus: 'verified'
    };

    // Add to fresh connections feed (top priority display)
    setFreshConnections(prev => [newContact, ...prev.slice(0, 4)]);
    setContacts(prev => [newContact, ...prev]);
  };

  return (
    <div className="space-y-4">
      <FreshConnectionsFeed connections={freshConnections} />
      <ContactsList contacts={contacts} onAddToCircle={handleAddToCircle} />
      <AddContactModal onAdd={addContact} />
    </div>
  );
}
```

#### **UI Components**
```typescript
// Fresh Connections Feed Component
function FreshConnectionsFeed({ connections }: { connections: Contact[] }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="flex items-center gap-2">
          ✨ Fresh Connections
          <Badge className="bg-green-100 text-green-700">+{connections.length} this week</Badge>
        </h3>
      </CardHeader>
      <CardContent>
        {connections.map(contact => (
          <div key={contact.id} className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{contact.name}</p>
                <p className="text-sm text-gray-600">{contact.mutuals} mutual • {contact.timeAgo}</p>
              </div>
            </div>
            <Button size="sm" onClick={() => onAddToCircle(contact)}>
              Add to Circle 🔗
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

### **Story 1.2: Allocate to Bounded Circle** 🔄
**Activity Loop**: Circle Loop  
**User Story**: As a community member, I want to allocate contacts to my bounded circle (limited to 9 tokens) so that I can create intentional trust relationships with economic backing.

**Implementation Phase**: Phase 2 (HCS-20 integration)  
**Success Metrics**:
- Technical: <2s allocation process
- UX: Clear limit warnings and guidance
- Judge Impact: High differentiation in bounded design, shows ripple effects

#### **Technical Implementation**
```typescript
// components/circle/CircleManager.tsx
export function CircleManager() {
  const { user, magicClient, braleClient } = useTrustMeshAuth();
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [availableSlots, setAvailableSlots] = useState(9);

  const allocateToCircle = async (contact: Contact, stakeAmount: number, context: string) => {
    // Validate circle capacity
    if (circleMembers.length >= 9) {
      throw new Error('Circle is full (9/9). Revoke a relationship first.');
    }

    // Validate TRST balance
    const trstManager = new TrstTokenManager(braleClient);
    const balance = await trstManager.getTrstBalance(user.braleAccountId);
    if (balance < stakeAmount) {
      throw new Error('Insufficient TRST balance');
    }

    // Stake TRST tokens
    const stakeId = await trstManager.stakeTrstForTrustToken(
      user.braleAccountId,
      stakeAmount,
      `trust-${contact.id}-${Date.now()}`
    );

    // Submit HCS-20 trust token
    const trustToken = await magicClient.submitTrustToken(
      contact.hederaAccountId,
      {
        trustType: 'professional',
        relationship: 'trusted_contact',
        context
      },
      stakeAmount
    );

    // Update circle
    const newMember: CircleMember = {
      contact,
      stakeAmount,
      stakeId,
      trustTokenId: trustToken.transactionId,
      allocatedAt: new Date().toISOString(),
      status: 'active'
    };

    setCircleMembers(prev => [...prev, newMember]);
    setAvailableSlots(prev => prev - 1);

    // Trigger celebration
    showCircleAllocationCelebration(newMember);
  };

  return (
    <div className="space-y-6">
      <CircleVisualization members={circleMembers} availableSlots={availableSlots} />
      <CircleMembersList members={circleMembers} onRevoke={handleRevoke} />
      <AllocationInterface onAllocate={allocateToCircle} />
    </div>
  );
}
```

#### **Circle Visualization Component**
```typescript
function CircleVisualization({ members, availableSlots }: CircleProps) {
  return (
    <div className="text-center py-6">
      <h2 className="text-lg font-bold mb-6">Your Circle of Trust</h2>
      
      {/* 9-dot circular layout */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        {Array.from({ length: 9 }, (_, i) => {
          const angle = (i * 360) / 9 - 90;
          const radian = (angle * Math.PI) / 180;
          const x = Math.cos(radian) * 80 + 96;
          const y = Math.sin(radian) * 80 + 96;
          
          const member = members[i];
          const isEmpty = !member;
          
          return (
            <div
              key={i}
              className={`absolute w-12 h-12 rounded-full transform -translate-x-6 -translate-y-6 flex items-center justify-center ${
                isEmpty 
                  ? 'bg-gray-200 border-2 border-dashed border-gray-400' 
                  : 'bg-green-500 text-white font-bold'
              }`}
              style={{ left: x, top: y }}
            >
              {member ? member.contact.name.split(' ').map(n => n[0]).join('') : '+'}
            </div>
          );
        })}
        
        {/* Center user */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            You
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Active: {members.length}/9 • Available: {availableSlots}</p>
        <p className="mt-2">💡 Quality over quantity - each connection requires economic backing</p>
      </div>
    </div>
  );
}
```

---

### **Story 1.3: Earn and Display Signals** 🏆
**Activity Loop**: Signals Loop  
**User Story**: As a volunteer, I want to earn signals as recognition tokens so that they display in my profile and contribute to circle strength.

**Implementation Phase**: Phase 3 (polish with animations)  
**Success Metrics**:
- Technical: <100ms refresh after earning
- UX: Engaging badge celebration
- Judge Impact: Demonstrates reputation boost, human-centered Web3

#### **Technical Implementation**
```typescript
// components/signals/SignalsManager.tsx
export function SignalsManager() {
  const { user, magicClient } = useTrustMeshAuth();
  const [earnedSignals, setEarnedSignals] = useState<UserSignal[]>([]);
  const [pendingOffers, setPendingOffers] = useState<SignalOffer[]>([]);

  const acceptSignalOffer = async (offer: SignalOffer) => {
    // Create HCS-5 Hashinal NFT
    const signal = await magicClient.createSignalNFT({
      recipient: user.hederaAccountId,
      name: offer.name,
      description: offer.description,
      category: offer.category,
      issuer: offer.issuedBy,
      metadata: {
        event: offer.event,
        witnesses: offer.witnesses,
        rarity: offer.rarity
      }
    });

    // Calculate reputation impact
    const reputationBoost = calculateSignalReputationBoost(offer.rarity);
    const newReputation = user.reputation + reputationBoost;

    // Update local state
    setEarnedSignals(prev => [signal, ...prev]);
    setPendingOffers(prev => prev.filter(o => o.id !== offer.id));

    // Trigger celebration
    showSignalEarnedCelebration(signal, reputationBoost);

    // Check for milestones
    const milestone = checkMilestoneProgression(newReputation);
    if (milestone) {
      showMilestoneCelebration(milestone);
    }
  };

  return (
    <div className="space-y-4">
      <SignalOffers offers={pendingOffers} onAccept={acceptSignalOffer} />
      <SignalCollection signals={earnedSignals} />
      <ReputationProgress current={user.reputation} />
    </div>
  );
}
```

#### **Signal Collection Display**
```typescript
function SignalCollection({ signals }: { signals: UserSignal[] }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="flex items-center gap-2">
          🏆 Trust Signals
          <Badge variant="secondary">{signals.length} earned</Badge>
        </h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {signals.map(signal => (
            <div key={signal.id} className="p-3 border rounded-lg text-center">
              <div className="text-2xl mb-2">{signal.emoji}</div>
              <h4 className="font-semibold text-sm">{signal.name}</h4>
              <p className="text-xs text-gray-600">{signal.issuer}</p>
              <Badge 
                className={`text-xs mt-2 ${
                  signal.rarity === 'rare' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {signal.rarity}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🏭 **Priority 2: Production Stories (Future Features)**

### **Story 2.1: Manage Contact Analytics** 🤝
**Activity Loop**: Contacts Loop  
**User Story**: As a premium user, I want analytics on my contacts (e.g., mutuals history) so that I can refine my network without exceeding circle bounds.

**Implementation Phase**: Post-hackathon (dashboard enhancements)  
**Success Metrics**:
- Technical: <1s load for analytics
- UX: Interactive network visualization
- Judge Impact: Adds data sovereignty depth

### **Story 2.2: Revoke from Circle** 🔄
**Activity Loop**: Circle Loop  
**User Story**: As an established user, I want to revoke allocations from my bounded circle so that I can update trust relationships while preserving history.

**Implementation Phase**: Post-hackathon (HCS updates)  
**Success Metrics**:
- Technical: <3s revocation with TRST return
- UX: Clear confirmation and safety checks
- Judge Impact: Shows programmable forgiveness in bounded system

### **Story 2.3: Customize Signals** 🏆
**Activity Loop**: Signals Loop  
**User Story**: As an admin, I want to create custom signals linked to contacts and circles so that community recognition drives engagement and value.

**Implementation Phase**: Post-hackathon (HCS-5 extensions)  
**Success Metrics**:
- Technical: Scalable signal creation
- UX: Intuitive signal editor
- Judge Impact: Enterprise potential in customization

---

## 🔧 **Integration with Context Engine**

Based on the external context about your **ContextEngine** architecture, these user stories integrate beautifully:

### **Context-Aware Trust Building**
```typescript
// Integration with ContextEngine from external context
const contextEngine = new ContextEngine();

// Contact addition triggers context awareness
contextEngine.emit('contact_added', {
  userId: user.hederaAccountId,
  contactId: contact.hederaAccountId,
  mutuals: contact.mutuals,
  context: 'fresh_connections_feed'
});

// Circle allocation creates trust context
contextEngine.emit('circle_allocation', {
  staker: user.hederaAccountId,
  recipient: contact.hederaAccountId,
  amount: stakeAmount,
  context: 'bounded_trust_circle'
});

// Signal earning updates reputation context
contextEngine.emit('signal_earned', {
  recipient: user.hederaAccountId,
  signalType: signal.name,
  reputationBoost: reputationBoost,
  context: 'trust_signals_loop'
});
```

---

## 📊 **Demo Success Metrics**

### **5-Minute Demo Flow**
1. **Add Contact** (30s) → Fresh connections feed populated
2. **Allocate to Circle** (90s) → Economic backing with TRST stakes  
3. **Earn Signal** (90s) → Reputation boost with celebration
4. **Review Updates** (60s) → Full profile transformation visible

### **Technical KPIs**
- ✅ All operations <5s response time
- ✅ Real-time UI updates
- ✅ Mobile-responsive design
- ✅ Zero crashes during demo

### **Judge Impact KPIs**
- ✅ **Wow factor**: Bounded circle visualization
- ✅ **Differentiation**: Economic backing for relationships
- ✅ **Business viability**: Clear network effects
- ✅ **Technical sophistication**: Real blockchain integration without complexity

---

**These user stories perfectly capture the TrustMesh vision while being absolutely achievable for the hackathon demo. The integration with your existing ContextEngine architecture creates a sophisticated, context-aware trust system that judges will find genuinely innovative!** 🚀

Ready to start implementing these stories? I'd recommend beginning with Story 1.1 (Add Contacts) as it provides the foundation for the other two loops! 🎯