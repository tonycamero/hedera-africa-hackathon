# HCS-21: Social Trust Graph Standard

**Status:** Draft  
**Type:** Standard  
**Category:** Identity & Social Networks  
**Authors:** Tony Camero, TrustMesh Team  
**Created:** 2025-10-13  
**Updated:** 2025-10-13  

## Abstract

HCS-21 defines a decentralized social trust graph protocol built on Hedera Consensus Service (HCS). This standard enables users to establish verifiable trust relationships, allocate reputation weights, and build consensus-based social networks without centralized intermediaries. The protocol combines contact bonding, trust allocation, and recognition systems to create a comprehensive framework for decentralized social reputation.

## Motivation

Current social platforms centralize trust signals, reputation data, and social graphs, creating platform lock-in and giving platforms unilateral control over users' social capital. HCS-21 addresses this by:

1. **Decentralizing Trust**: Moving trust relationships to a consensus-based, immutable ledger
2. **User Ownership**: Ensuring users own their social graph and reputation data
3. **Interoperability**: Enabling trust data to be portable across applications
4. **Verifiability**: Making all trust signals cryptographically verifiable and auditable

## Specification

### Dependencies

HCS-21 builds upon and integrates with existing HCS standards:

- **HCS-2**: Topic Registries - for organizing social data across topics
- **HCS-11**: Profile Metadata - for user identity representation
- **HCS-20**: Auditable Points - for trust weight tracking and validation
- **HCS-5**: Hashinals - for recognition token issuance

### Core Components

#### 1. Social Graph Topics

HCS-21 defines four core topic types for social graph data:

```
PROFILES: HCS-11 compliant user profile data
CONTACTS: Contact requests, acceptances, and bonding events  
TRUST: Trust allocations, revocations, and weight adjustments
RECOGNITION: Achievement tokens and social recognition signals
```

#### 2. Message Format

All HCS-21 messages follow this base envelope structure:

```json
{
  "hcs": "21",
  "v": "1.0",
  "type": <event_enum>,
  "from": <actor_id>,
  "nonce": <monotonic_counter>,
  "ts": <unix_timestamp>,
  "payload": <event_specific_data>
}
```

Where `event_enum` follows cost-optimized numerical encoding:

| Enum | Event Type | Description |
|------|------------|-------------|
| 0    | CONTACT_REQUEST | Initiate contact bonding |
| 1    | CONTACT_ACCEPT  | Accept contact bonding |
| 2    | CONTACT_REVOKE  | Revoke contact relationship |
| 3    | TRUST_ALLOCATE  | Allocate trust weight to contact |
| 4    | TRUST_REVOKE    | Revoke trust allocation |
| 5    | RECOGNITION_MINT| Issue recognition token |
| 6    | RECOGNITION_VALIDATE| Validate recognition claim |

#### 3. Contact Bonding Protocol

**Contact Request (Type 0):**
```json
{
  "hcs": "21", "v": "1.0", "type": 0,
  "from": "tm-alice",
  "nonce": 1001,
  "ts": 1699999999,
  "payload": {
    "target": "tm-bob",
    "handle": "Alice Chen",
    "message": "Hi Bob, let's connect!"
  }
}
```

**Contact Accept (Type 1):**
```json
{
  "hcs": "21", "v": "1.0", "type": 1,
  "from": "tm-bob",
  "nonce": 2001,
  "ts": 1699999999,
  "payload": {
    "target": "tm-alice",
    "handle": "Bob Smith",
    "request_nonce": 1001
  }
}
```

**Bonding Rules:**
- Bonding requires mutual acceptance (bidirectional)
- Only bonded contacts are eligible for trust allocation
- Bonding relationships can be revoked unilaterally

#### 4. Trust Allocation System

**Trust Allocation (Type 3):**
```json
{
  "hcs": "21", "v": "1.0", "type": 3,
  "from": "tm-alice",
  "nonce": 1002,
  "ts": 1699999999,
  "payload": {
    "target": "tm-bob",
    "weight": 1,
    "category": "technical",
    "note": "Excellent technical leadership"
  }
}
```

**Trust Allocation Rules:**
- Users have a maximum trust capacity (default: 9 slots)
- Trust can only be allocated to bonded contacts
- Trust allocations are immediate and don't require acceptance
- Later allocations to the same target override previous ones
- Trust weight contributes to the target's overall reputation score

#### 5. Recognition Token System

**Recognition Mint (Type 5):**
```json
{
  "hcs": "21", "v": "1.0", "type": 5,
  "from": "tm-alice",
  "nonce": 1003,
  "ts": 1699999999,
  "payload": {
    "target": "tm-bob",
    "token_type": "technical-expert",
    "metadata": {
      "name": "Technical Expert",
      "description": "Deep technical knowledge and problem solving",
      "category": "knowledge",
      "trust_value": 0.5
    },
    "evidence": "https://github.com/example/pr/123"
  }
}
```

### Topic Architecture

#### Single Registry vs Multi-Topic

HCS-21 supports both architectures based on scale requirements:

**Multi-Topic (Recommended for Scale):**
- Separate topics for each message type enable parallel processing
- Better performance for large networks
- Allows topic-specific governance models

**Single Registry (Simplified Deployment):**
- All messages to one topic with type-based filtering
- Easier setup for smaller networks
- Lower operational complexity

#### Topic Governance

Topics can use different governance models:

1. **Operator Governance**: Single account controls topic
2. **Multi-Signature**: Requires multiple signatures for topic updates
3. **Community Governance**: HCS-8/9 poll-based governance
4. **Open**: No restrictions on message submission

### Data Processing Rules

#### Trust Score Calculation

Individual trust scores are calculated using:

```
trust_score = Σ(allocated_weight_i * allocator_reputation_i) / total_allocators
```

Where:
- `allocated_weight_i` is the trust weight allocated by allocator i
- `allocator_reputation_i` is the reputation score of the allocator
- This creates a recursive, PageRank-style reputation system

#### Contact Graph Validation

- Contact relationships require mutual acceptance
- Trust can only flow between bonded contacts
- Recognition tokens can be issued to any user (bonded or not)
- All events are processed chronologically by timestamp

#### Spam Prevention

- Nonce values must be monotonically increasing per sender
- Timestamp must be within acceptable bounds (±10 minutes)
- Rate limiting can be implemented at the application layer
- Economic spam prevention through HCS transaction costs

### Integration with Existing Standards

#### HCS-11 Profile Integration

```json
// Profile topic message referencing social graph
{
  "hcs": "11",
  "profile": {
    "id": "tm-alice",
    "name": "Alice Chen",
    "social_graph_topics": {
      "hcs21_contacts": "0.0.123456",
      "hcs21_trust": "0.0.123457", 
      "hcs21_recognition": "0.0.123458"
    }
  }
}
```

#### HCS-20 Points Integration

Trust allocations are treated as HCS-20 auditable points:
- Trust weight = points allocated
- Trust capacity = maximum points per user
- All allocations are auditable and verifiable
- Supports point transfer and delegation mechanisms

### Privacy Considerations

#### Public by Design
- All trust relationships are publicly visible
- Trust allocations and weights are transparent
- Recognition tokens and their metadata are public
- This transparency is essential for reputation verification

#### Privacy Preservation Options
- Users can use pseudonymous identifiers
- Off-chain encrypted metadata for sensitive information
- HCS-19 compliance for privacy regulation adherence
- Selective disclosure of relationship details

### Security Model

#### Cryptographic Integrity
- All messages signed by sender's private key
- Hedera consensus ensures message ordering and finality
- Immutable audit trail of all social graph changes
- Protection against replay attacks via nonce system

#### Sybil Resistance
- Trust allocation limits prevent single-user manipulation
- Recursive reputation scoring reduces fake account impact
- Economic costs of HCS messages create natural spam prevention
- Social validation through recognition token system

### Implementation Guidelines

#### Message Validation
1. Verify message signature and sender authorization
2. Validate nonce is greater than last processed nonce for sender
3. Check timestamp is within acceptable bounds
4. Validate payload structure matches event type schema
5. Apply business rules (e.g., trust capacity limits)

#### State Management
Applications should maintain derived state including:
- Current bonded contact lists per user
- Active trust allocations and remaining capacity
- Recognition token ownership and metadata
- Calculated reputation scores

#### Performance Optimization
- Use topic memo fields for efficient filtering
- Implement caching layers for frequently accessed data
- Consider read replicas for high-query workloads
- Batch process historical data during initial sync

## Reference Implementation

A reference implementation is available at:
- **Demo**: https://trust-mesh-hackathon-ly67xp8hy.vercel.app/
- **Source**: https://github.com/scendmoney/hedera-africa-hackathon/tree/ux-variant-1-professional
- **API Documentation**: Available in repository

The implementation includes:
- Complete HCS-21 message processing
- Web interface for social graph management
- Real-time updates via HCS WebSocket subscriptions
- Integration with Hedera Wallet Connect

## Test Vectors

### Example Social Graph Flow

1. **Alice requests contact with Bob:**
```json
{"hcs":"21","v":"1.0","type":0,"from":"tm-alice","nonce":1001,"ts":1699999999,"payload":{"target":"tm-bob","handle":"Alice Chen","message":"Let's connect!"}}
```

2. **Bob accepts Alice's request:**
```json
{"hcs":"21","v":"1.0","type":1,"from":"tm-bob","nonce":2001,"ts":1700000100,"payload":{"target":"tm-alice","handle":"Bob Smith","request_nonce":1001}}
```

3. **Alice allocates trust to Bob:**
```json
{"hcs":"21","v":"1.0","type":3,"from":"tm-alice","nonce":1002,"ts":1700000200,"payload":{"target":"tm-bob","weight":1,"category":"technical","note":"Great developer"}}
```

4. **Alice issues recognition token to Bob:**
```json
{"hcs":"21","v":"1.0","type":5,"from":"tm-alice","nonce":1003,"ts":1700000300,"payload":{"target":"tm-bob","token_type":"problem-solver","metadata":{"name":"Problem Solver","trust_value":0.4}}}
```

## Backwards Compatibility

HCS-21 is designed for forward compatibility:
- Version field allows protocol evolution
- Payload schemas can be extended without breaking changes
- New event types can be added with higher enum values
- Legacy message formats can be supported during migration

## References

- [HCS-2: Advanced Topic Registries](https://hashgraphonline.com/docs/standards/hcs-2)
- [HCS-11: Profile Metadata Standard](https://hashgraphonline.com/docs/standards/hcs-11)  
- [HCS-20: Auditable Points Standard](https://hashgraphonline.com/docs/standards/hcs-20)
- [HCS-5: Tokenized HCS-1 Files](https://hashgraphonline.com/docs/standards/hcs-5)
- [Hedera Consensus Service Documentation](https://docs.hedera.com/hedera/core-concepts/consensus-service)

## Copyright

This document is placed in the public domain.