# Ingestion Pipeline

## Data path

```
Mirror REST (paged) ─┐
                     ├──> decode → normalize → dedupe → SignalsStore
Mirror WS (stream) ──┘
                     ↑
                     backoff+jitter; REST poll fallback
```

## Components

- `lib/ingest/ingestor.ts`  
  Orchestrates startup/shutdown, stats, error handling.

- `lib/ingest/restBackfill.ts`  
  - Paged by timestamp, **ascending** to preserve causality.  
  - Cursor persisted (localStorage in browser).

- `lib/ingest/wsStream.ts`  
  - Connects to `wss://testnet.mirrornode.hedera.com:5600`.  
  - Exponential backoff + jitter; fallback to REST poll.

- `lib/ingest/normalizers.ts`  
  - Accepts base64 or JSON messages.  
  - Outputs `SignalEvent { id, type, actor, target, ts, meta }`.

- `lib/ingest/recognition/*`  
  - **Two-phase**: cache definitions → resolve instances.  
  - Pending queue reprocessed when defs arrive.

## Cursors

- Per-topic consensus timestamp.  
- Prevents dupes across restarts and WS reconnects.

## Health

- `/api/health/ingestion` returns:
  - per-topic counts, cursors, last error, ws status, backfill status.

## Testing

- Unit tests cover:
  - URL building, env cleaning, normalizers, two-phase logic, backoff.