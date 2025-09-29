# Registry

Single source of truth for topics + mirror URLs.

## Resolution order

1) Server registry API → `/api/registry/topics`  
2) Cleaned env vars (`NEXT_PUBLIC_*`)  
3) Hard fallback (dev only)

## Sample response

```json
{
  "ok": true,
  "topics": {
    "contacts": "0.0.6896005",
    "trust": "0.0.6896005",
    "recognition": "0.0.6895261",
    "profile": "0.0.6896008",
    "feed": "0.0.6896005",
    "system": "0.0.6896005"
  },
  "mirror": {
    "rest": "https://testnet.mirrornode.hedera.com/api/v1",
    "ws":   "wss://testnet.mirrornode.hedera.com:5600"
  },
  "ts": 1699999999
}
```

## Hot-swap

* Registry watcher updates runtime config without rebuild.
* Ingestor reads latest map on reconnect/backfill.
* UI consumes store; no component-level wiring needed.

## Health

* Registry section included in `/api/health/hcs`.