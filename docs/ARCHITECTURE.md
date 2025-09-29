# Architecture

TrustMesh = UI (Next.js) + Ingestion + Stores + Registry + HCS (Mirror).

## High-level flow (ASCII)

```
[Hedera HCS Topics] --(Mirror REST/WS)--> [Ingestion Orchestrator]
|                                           |
|                                   normalize/resolve
v                                           v
[Recognition defs/inst] --> [Two-phase cache] --> [SignalsStore]
                        ^                |
                        | (lookups)      v
                  [Registry Service] <-- UI Pages
```

## Layers

- **UI (Next.js app)**  
  Pages: `/circle`, `/contacts`, `/recognition`.  
  Components render from `SignalsStore` selectors.

- **Ingestion**  
  - `restBackfill` (cursor-based, ascending order)  
  - `wsStream` (real-time, backoff+poll fallback)  
  - `normalizers` (defensive parsing, idempotent)  
  - `recognition` (two-phase: defs → instances)

- **Stores**  
  - `SignalsStore`: canonical event log (contacts, trust, recognition).  
  - Batched writes, "My/Global" scope in selectors.

- **Registry**  
  - `/api/registry/topics` → topic map (+ Mirror URLs).  
  - Client/server both consume (avoids drift).

- **HCS (testnet)**  
  - Topics (examples):  
    - Contacts/Trust: `0.0.6896005`  
    - Recognition: `0.0.6895261`  
    - Profile: `0.0.6896008`

## Contracts & Guarantees

- **No demo in production** (gated by `NEXT_PUBLIC_ALLOW_DEMO=off`)  
- **Env cleaning** (handles `\r\n`, robust booleans)  
- **URL guards** (prevents `/api/v1/api/v1` regressions)  
- **Idempotency** via cursor + event keys