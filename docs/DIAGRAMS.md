# Diagrams (ASCII)

## System

```
+-------------------------+     REST/WS      +----------------------+
| Hedera Mirror (testnet) | ----------------> | Ingestion Orchestrator|
+-------------------------+                   +----------+-----------+
                                                        |
+------------------------------+---------------+-------+
| normalize / idempotent / two-phase resolve   |
v                                              v
+--------------+                              +---------------+
| Defs Cache   | <--- resolve instances ----> | SignalsStore  |
+--------------+                              +-------+-------+
                                                      |
                                                      v
                                              +------------------------+
                                              | Next.js UI (Circle/...)|
                                              +------------------------+
```

## Ingestion internals

```
[restBackfill] -> [normalizers] -> [store(batch)]
                ^                          |
                | (gap fill)                v
        [wsStream(backoff)] <----- cursor ----- [cursor.ts]
```

## ERM-lite (logical)

```
SignalEvent(id, type, actor, target?, ts, meta)
├─ Contact: CONTACT_REQUEST/ACCEPT
├─ Trust: TRUST_ALLOCATE/ACCEPT/DECLINE
└─ Recognition: RECOGNITION_DEF / RECOGNITION_MINT

RecognitionDefinition(id|slug, name, emoji?, schema)
RecognitionInstance(id, defId, owner, issuer, ts, meta)
```