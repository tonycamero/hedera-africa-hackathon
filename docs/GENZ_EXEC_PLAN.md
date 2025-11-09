# GENZ_EXEC_PLAN.md

## Overview

Implement GenZ Lens as **flagged UI + thin services** on top of the Professional branch. Reuse ingestion, mirror, registry, and recognition services. Add Boost Page, operator-signed boost/suggest endpoints, and folded counts.

---

## Sprints & Tickets

### Sprint 1 — GenZ surface + "Send → Share" core (2–3 days)

**T1. GenZ Theme & Flags**

* Add `GENZ_LENS` env; scoped theme tokens in `globals.css`
* Touch: `app/layout.tsx`, `app/providers/*`, `lib/env.ts`
* AC: Flag off = no visual diffs vs Professional

**T2. Send Signal Modal (template-first)**

* Component: `components/SendSignalModal.tsx`
* Guard: `lib/filters/contentGuard.ts` (positivity, length)
* Use existing recognition mint; return `{signalId, boostId, boostUrl}`
* AC: Submit → HCS mint → Success sheet (Copy/Share/View)

**T3. Signals List Boost UI**

* Add **⚡ Boost N** chip + Share to each row
* Store: extend `lib/stores/signalsStore.ts` with `boostCounts` map
* AC: Optimistic update; polling reconciliation < 2s

**T4. Boost URL contract & utils**

* Canonical path: `/boost/:boostId` where `boostId = base58url(topicId + consensusNs)`
* Utils: `lib/ids/boostId.ts`, `lib/config/routes.ts`
* AC: Deterministic, round-trip safe across envs

---

### Sprint 2 — Public Boost Page & operator writes (3–4 days)

**T5. Public Boost Page (SSR)**

* File: `app/boost/[boostId]/page.tsx`
* Read svc: `lib/services/BoostReadService.ts` (mirror lookup)
* Actions: **⚡ Boost** (anon), **Suggest** (auth)
* AC: LCP p95 < 2.0s mobile; hide/report path works

**T6. Operator write path (HCS)**

* Svc: `lib/services/OperatorBoostWriter.ts`
* Endpoints:

  * `app/api/boost/agree/route.ts` → write `BOOST_AGREE`
  * `app/api/boost/suggest/route.ts` → write `BOOST_SUGGEST`
* Idempotency: header `Idempotency-Key`
* AC: Duplicate POST is no-op (200), mirror shows single event

**T7. Public Contact Card `/u/[handle]`**

* File: `app/u/[handle]/page.tsx`
* Read svc: `lib/services/PublicProfileService.ts` (KNS fallback later)
* AC: No PII leak; 3 recent public signals (titles only)

**T8. Ingestion folding for boost counts**

* Extend `lib/ingest/ingestor.ts` reducers to fold `BOOST_AGREE` into `boostCounts`
* Optional live ping via `lib/ingest/wsStream.ts`
* AC: Counts converge ≤ 2s; memory cap preserved

---

### Sprint 3 — Fit & finish, KNS, polish (2–3 days)

**T9. KNS Resolver (read-only)**

* File: `lib/services/KnsResolver.ts` (LRU cache, TTL 5m)
* Touch: Boost Page, Contact Card, Signals rows
* AC: ≥80% cache hit after warm; graceful fallback

**T10. Share snippets + OG cards**

* Dynamic OG: `app/boost/[boostId]/opengraph-image.tsx`
* Share copy helper: `lib/share/copy.ts`
* AC: Proper unfurl on X/Discord/WhatsApp

**T11. Rate limits & abuse guard (v0)**

* `lib/guard/rateLimiter.ts` (IP+UA+cookie)
* Limits: Boost ≤1/18h/boostId; Suggest ≤3/24h/user
* AC: Friendly messages; withstands 200 rps burst

**T12. Hide/Report**

* Endpoints: `app/api/boost/hide/route.ts`, `app/api/boost/report/route.ts`
* UI: overflow menu on Signals and Boost Page
* AC: Hidden page shows neutral message; owner can unhide

**T13. Micro-motion & haptics**

* Utility: `lib/ui/haptics.ts`
* Light confetti on first boost; pulse on count increment
* AC: 60fps; no CLS spikes

**T14. A11y & i18n lite**

* 44px targets, ARIA, focus traps, keyboard nav
* Extract strings to `lib/i18n/en.ts`
* AC: Axe: no critical issues

---

## API Contracts (v1)

### POST `/api/boost/agree`

* **Headers:** `Idempotency-Key`
* **Body:** `{ boostId: string }`
* **200:** `{ ok: true, boostId, newCount }`
* **Errors:** `429` rate limit; `400` invalid; `409` idempotent duplicate

### POST `/api/boost/suggest`

* **Auth required**
* **Body:** `{ boostId: string, templateId: string, note?: string }`
* **200:** `{ ok: true, suggestionId }`
* **Errors:** `400` invalid; `422` guard failed; `429` rate limit

### POST `/api/boost/hide`

* **Auth (recipient)**
* **Body:** `{ boostId: string, hidden: boolean }`
* **200:** `{ ok: true, hidden }`

### POST `/api/boost/report`

* **Body:** `{ boostId: string, reason: string }`
* **200:** `{ ok: true, caseId }`

---

## HCS Event Families (v1)

* `RECOGNITION_MINT` (existing)
* `BOOST_AGREE` → `{ boostId, signalId, ts, issuer: 'operator', idempotencyKey }`
* `BOOST_SUGGEST` → `{ boostId, signalId, templateId, noteHash?, ts, issuer: 'operator' }`

---

## Guardrails (for Warp)

* **Do not** rename/move Professional services.
* **Do** keep all GenZ code behind `GENZ_LENS`.
* **Do** create small, focused services (readers, writers, guards).
* **Don't** alter trust math—counts only in this pass.
* **Do** write unit tests for content guard, idempotency, rate-limit.

---

## KPIs (first week)

* Share rate: `share_click / send_signal_submit` ≥ **50%**
* Boost conversion: `boost_agree_click / boost_page_view` ≥ **30%**
* Suggest conversion: `signup_success / boost_suggest_open` ≥ **25%**
* Hide rate ≤ **5%**