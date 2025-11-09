# LOOP_TWO_MESSAGING_PAYMENTS_SPEC.md
**Status:** Draft — Ready for Warp Execution  
**Author:** Tony Camero  
**Date:** 2025-11-09  
**Branch Target:** `feature/loop-two-messaging-payments`

---

## 🌟 Purpose

Define **Loop Two: Messaging & Payments** as the central interaction layer of TrustMesh.  
It connects the social network (Contacts) and the reputation network (Signals) by hosting **real-time conversations, TRST payments, and contextual actions** inside encrypted threads.

---

## 🔍 Navigation Structure

| Tab | Label | Icon | Purpose |
|-----|--------|------|----------|
| 1 | **Contacts** | `Users` | Build & manage relationships, bond via HCS-22, manage Inner Circle |
| 2 | **Messages** *(Messaging & Payments)* | `MessageCircle` | Converse, coordinate, and transact TRST in context |
| 3 | **Signals** | `Activity` | Recognition, props, and reputation feedback |

> The label in UI remains **Messages** for clarity, but copy references **Messages & Payments.**

---

## 👨‍🔧 Functional Overview

> “Talk, coordinate, and settle — all in one thread.”

Each thread = a **secure XMTP conversation** anchored to the participant identities (`ScendIdentity`).  
Each conversation supports contextual TRST transfers executed via Brale + Hedera wallet logic.

| Feature | Description |
|----------|-------------|
| **Threaded Messaging** | Real-time XMTP chat with E2EE |
| **Contextual Payments** | `sendTRSTWithContext()` injects a payment card inline |
| **Transaction History** | Each thread maintains structured record of payments |
| **Smart Actions** | Quick actions under messages: Request Payment, Acknowledge, Send Recognition |
| **Fail-Soft Mode** | If XMTP disabled, show static contact info + invite flow |

---

## 🔧 Architecture Layers

| Layer | Technology | Role |
|--------|-------------|------|
| **Transport** | XMTP Browser SDK | E2EE messaging |
| **Identity** | ScendIdentity (Magic + HCS-22) | Dual-key verification |
| **Settlement** | TRST Stablecoin (Brale/Hedera) | Instant payments |
| **Context Engine** | Internal event bus | Routes message actions (trust, recognition, payments) |

---

## 🔌 UI / UX Specification

### Messages Tab Layout

```
---------------------------------------------------
| Header: "Messages & Payments"                   |
| Subtext: "Converse privately and settle TRST"   |
---------------------------------------------------
| [ Search / Start New Thread ]                   |
|                                                 |
| Recent Threads                                  |
|  ├── John D.      [💬 3]  [Paid +20 TRST]       |
|  ├── Sarah L.     [🪙 Pending 50 TRST]         |
|  └── Culture DAO  [✨ 1 new recognition]        |
---------------------------------------------------
| Bottom Nav: Contacts | Messages | Signals       |
---------------------------------------------------
```

### Thread View

```
---------------------------------------------------
| John D. [Inner Circle 💎]                       |
|-------------------------------------------------|
| 🧑‍💬 You: Hey, did the drop arrive?            |
| 👤 John: Yup, thanks again 🙏                  |
| 💸 Payment Card: +20 TRST sent (view hash)     |
| ------------------------------------------------|
| [ Message box .... ][📤][🪙 Pay][✨ Recognize]  |
---------------------------------------------------
```

---

## 🔋 Data Model

```ts
export interface ConversationContext {
  id: string
  participants: ScendIdentity[]
  lastMessageAt: number
  balance?: number           // TRST net balance
  lastPaymentHash?: string
  lastSignalId?: string
}

export interface PaymentMessage {
  type: 'payment'
  amount: number
  currency: 'TRST'
  txHash: string
  context: string            // memo or recognition ID
}
```

All contextual messages are client-side; optional anchoring via HCS-20 planned for later.

---

## 📚 Implementation Plan (Warp Tickets)

| Ticket | Title | Description |
|--------|--------|-------------|
| **LP-1** | `/messages` tab & route | Base layout + navigation integration |
| **LP-2** | Thread list component | Lists active threads, payment indicators |
| **LP-3** | Thread view | Message composer, payment cards, quick actions |
| **LP-4** | TRST Payment integration | Embed contextual payment logic |
| **LP-5** | Context Engine hooks | Link events to Signals and Recognition |
| **LP-6** | Fail-soft & invite states | Graceful fallback if XMTP disabled |
| **LP-7** | Tests & metrics | Ensure <10s message latency, 100% delivery |

---

## ✅ Acceptance Criteria

- `/messages` tab visible + navigable  
- XMTP messaging functional between bonded contacts  
- TRST contextual payments operational  
- Fail-soft behavior verified  
- Conversation list updates live  
- 85%+ test coverage on UI + flow

---

## 📊 Metrics

| Metric | Target |
|---------|--------|
| `t₁` time-to-first-message | < 10s |
| `p₁` payment success rate | 100% |
| `v₁` viral coefficient | > 2.0 |
| `r₁` 7-day retention | > 60% |

---

## 🔬 Future Enhancements

| Phase | Extension |
|-------|------------|
| **2** | Group chats + split payments |
| **3** | TRST escrow / request flows |
| **4** | AI summarization of threads |
| **5** | Optional HCS-anchored message hashes |

---

## 💡 Narrative Summary

> **Loop Two is where trust moves.**  
> You talk, you coordinate, you transact — all inside one encrypted thread.  
> It’s messaging with consequence.

---

### Next for Warp
1. Create branch `feature/loop-two-messaging-payments`  
2. Execute LP-1 → LP-4 sequentially  
3. Integrate with `useIdentity()` + `sendTRSTWithContext()`  
4. Push build and collect metrics

