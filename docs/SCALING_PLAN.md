# TrustMesh Scaling Plan

## Current State: Hackathon → Production Gaps

### Memory Issues
- **Current**: 200 message cap in signalsStore
- **Problem**: At 100K users = 50GB RAM needed
- **Solution**: Move to Redis + PostgreSQL

### API Bottlenecks  
- **Current**: Every request hits Mirror Node
- **Problem**: At scale = Mirror Node rate limiting
- **Solution**: 3-tier cache (Redis → DB → HCS)

### Topic Congestion
- **Current**: 4 global topics for all users  
- **Problem**: 175M messages/day through same pipes
- **Solution**: Topic sharding by user segments

## Phase 1: Immediate Optimizations (Next Sprint)

### 1. Smart Cache Layer
```typescript
interface CacheStrategy {
  ttl: string
  maxSize: number  
  evictionPolicy: 'LRU' | 'TTL' | 'USER_BASED'
}

const contactsCache: CacheStrategy = {
  ttl: '1h',
  maxSize: 10000, // messages per user
  evictionPolicy: 'USER_BASED'
}
```

### 2. Incremental Sync
```typescript
// Replace full backfill with incremental
export async function incrementalBackfill(userId: string, since?: string) {
  const query = since 
    ? `${MIRROR_REST}/topics/${TOPIC.contacts}/messages?timestamp=gte:${since}&account.id=${userId}`
    : `${MIRROR_REST}/topics/${TOPIC.contacts}/messages?limit=50&account.id=${userId}`
  
  return fetchAndCache(query, userId)
}
```

### 3. Message Filtering
```typescript
// Only cache relevant messages per user
export function filterRelevantMessages(messages: HCSMessage[], userId: string): HCSMessage[] {
  return messages.filter(msg => {
    const data = JSON.parse(msg.decoded)
    return data.from === userId || 
           data.to === userId || 
           data.target === userId ||
           data.actor === userId
  })
}
```

## Phase 2: Database Migration (Month 2)

### PostgreSQL Schema
```sql
-- Partitioned by user_id for horizontal scaling
CREATE TABLE hcs_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) NOT NULL,
    topic_id VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    sequence_number BIGINT NOT NULL,
    consensus_timestamp TIMESTAMP NOT NULL,
    actor VARCHAR(50),
    target VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX(user_id, message_type, consensus_timestamp)
) PARTITION BY HASH(user_id);
```

### Redis Session Cache  
```typescript
// Per-user session cache
export class UserSessionCache {
  constructor(private userId: string) {
    this.redis = new Redis({ keyPrefix: `tm:${userId}:` })
  }
  
  async getContacts(): Promise<Contact[]> {
    const cached = await this.redis.get('contacts')
    if (cached) return JSON.parse(cached)
    
    // Fallback to DB, then HCS
    return this.loadFromDatabase()
  }
}
```

## Phase 3: HCS Architecture (Month 3)

### Topic Sharding Strategy
```
Current: 4 global topics
Future: User-segment topics

Tier 1 Users (< 1K): topic-tier1-contacts  
Tier 2 Users (1K-10K): topic-tier2-segment-{A,B,C}
Enterprise: topic-enterprise-{company-id}
```

### Message Routing
```typescript
export function getTopicForUser(userId: string, messageType: string): string {
  const userTier = getUserTier(userId)
  const segment = hashUser(userId) % getSegmentCount(userTier)
  
  return `${TOPIC_PREFIX}-${userTier}-${messageType}-${segment}`
}
```

## Capacity Planning

| User Count | Messages/Day | Storage/Month | Infrastructure |
|------------|--------------|---------------|----------------|
| 10K        | 1.75M        | 5GB          | Single Redis + PG |
| 100K       | 17.5M        | 50GB         | Redis Cluster + PG Cluster |
| 1M         | 175M         | 500GB        | Multi-region + CDN |
| 10M        | 1.75B        | 5TB          | Event sourcing + CQRS |

## Cost Analysis (AWS)

### Current Approach (No Caching)
- **10K users**: ~$2,000/month (Mirror Node API costs)
- **100K users**: ~$20,000/month (rate limiting issues)
- **1M users**: Not feasible (Mirror Node quotas)

### Optimized Approach
- **10K users**: ~$500/month (Redis + RDS)
- **100K users**: ~$2,500/month (Cluster + CDN)
- **1M users**: ~$15,000/month (Multi-region)

## Implementation Priority

1. ✅ **Week 1**: Smart message filtering  
2. ⚠️ **Week 2**: Redis cache layer
3. 📋 **Week 3**: Incremental sync
4. 📋 **Month 2**: PostgreSQL migration
5. 📋 **Month 3**: Topic sharding

---

**Bottom Line**: Current architecture is fine for hackathon/demo, but needs complete overhaul for production scale. The good news is the HCS foundation is solid - it's the caching and data management that needs work.