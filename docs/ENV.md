# Environment Configuration

## Client (exposed) — `NEXT_PUBLIC_*`

```
NEXT_PUBLIC_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com/api/v1
NEXT_PUBLIC_MIRROR_NODE_WS=wss://testnet.mirrornode.hedera.com:5600

# Topics (testnet examples)
NEXT_PUBLIC_TOPIC_CONTACT=0.0.6896005
NEXT_PUBLIC_TOPIC_TRUST=0.0.6896005
NEXT_PUBLIC_TOPIC_RECOGNITION=0.0.6895261
NEXT_PUBLIC_TOPIC_PROFILE=0.0.6896008

# Safety flags
NEXT_PUBLIC_ALLOW_DEMO=off          # prod default
NEXT_PUBLIC_HCS_ENABLED=true
```

## Server-only (never expose in bundle)

```
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxxxx
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
```

## Cleaning & Guards

- **Boolean parsing:** accepts `true/1/yes/on` (case-insensitive).  
- **Line-ending cleanup:** trims `\r\n`.  
- **URL guards:** code prevents double `/api/v1` and duplicate `:5600`.

## Verification

- `pnpm test` (env/URL guards)  
- Visit `/api/registry/topics` (all topics present)  
- Visit `/api/health/hcs` and `/api/health/ingestion` (green)