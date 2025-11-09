# INNER_CIRCLE_META_SYSTEM_SPEC.md
**Status:** Draft — Meta-System Architecture  
**Author:** Tony Camero  
**Date:** 2025-11-09  
**Branch Target:** `feature/inner-circle-meta-system`

---

## 🔍 Purpose

The **Inner Circle** is being repositioned as a *meta-system*, not a primary gameplay loop.  
It acts as a **trust-weighting and social graph constraint** that underpins Contacts (Loop One) and Signals (Loop Three), while remaining invisible in everyday UX.

Its role: define *who matters most* in your network — capped at **nine peers** whose trust influences recognition, payments, and network visibility.

---

## 🔧 Core Principles

| Principle | Description |
|------------|-------------|
| **9-Max Rule** | A user can maintain a maximum of nine Inner Circle relationships. |
| **Bidirectional Bonding** | Inner Circle status only applies when both users mutually confirm the bond. |
| **Weighted Trust Influence** | Recognition and signals from Inner Circle members receive higher impact scores. |
| **Layered Visibility** | Inner Circle contacts are visually prioritized but never isolated in UX. |
| **Cross-Loop Integration** | Influences both Contact recommendations and Recognition weighting. |

---

## 👨‍🔧 Functional Overview

The Inner Circle meta-system provides *hooks* into other loops without user friction.

| Loop | Integration | Effect |
|------|--------------|--------|
| **Contacts** | Add Contact flow includes an optional *Add to Inner Circle* toggle. | Establishes high-trust link between two users. |
| **Messaging/Payments** | Inner Circle status subtly upgrades chat priority and trust context. | Enables privileged functions (e.g., auto-pay trust, no confirmation for micro-transfers). |
| **Signals/Recognition** | Recognition from Inner Circle carries a higher weighting. | Increases reputation signal strength. |

---

## 🔌 Technical Model

```ts
export interface InnerCircleBond {
  id: string
  initiator: string           // Hedera account ID
  recipient: string           // Hedera account ID
  mutual: boolean             // true when both users accept
  createdAt: number
  lastUpdated: number
  status: 'pending' | 'active' | 'revoked'
}

export interface InnerCircleGraph {
  owner: string                // Hedera account ID
  bonds: InnerCircleBond[]
  maxSize: 9
}
```

**Storage:**
- Immutable bonding events written to `HCS-10` topics.  
- Cache persisted locally for faster access.

**Resolution:**
- `getInnerCircleGraph(accountId)` returns all active bonds.

---

## 🔀 Influence Propagation

| System | Mechanism | Effect |
|---------|------------|--------|
| **Signals** | When recognition minted, check if sender ∈ Inner Circle. | Amplify recognition weight by 1.5x. |
| **Reputation** | Weighted average of received signals by Inner Circle members. | Enhances trust ranking. |
| **Contacts** | Contact suggestions rank Inner Circle contacts higher. | Increases proximity relevance. |

---

## 🔄 Lifecycle

1. **Initiation:** User selects *Add to Inner Circle* during contact bonding.  
2. **Confirmation:** Recipient must accept; creates mutual bond.  
3. **Limit Enforcement:** If `InnerCircleGraph.bonds.length >= 9`, prompt to remove one.  
4. **Propagation:** Trust weighting updated across systems.  
5. **Revocation:** Either party can revoke bond; effects decay after 7 days.

---

## 💡 UX Notes

- Inner Circle is *not a separate screen*; it manifests as badges, highlights, and micro-interactions.
- When a user is at max (9), the Add toggle greys out.
- Recognition cards show a subtle 💎 (diamond) badge if from an Inner Circle member.

---

## 🔬 Data Flow Summary

```
[HCS-10 Contact Topic] → Contact Bond Event → [InnerCircle Service]
   ↓                            ↓
   Mutual Confirmation → InnerCircleGraph.update()
   ↓                            ↓
   Context Engine → Weight Propagation (Signals / Recognition)
```

---

## 💡 Future Hooks

| Phase | Extension |
|--------|------------|
| **Phase 2** | Add Inner Circle visualization in Contacts graph view. |
| **Phase 3** | Weight trust allocation limits based on Inner Circle size. |
| **Phase 4** | Enable local reputation DAOs for high-density Inner Circles. |

---

## ✅ Definition of Done

- [ ] All contact bonding events write `isInnerCircle` boolean.
- [ ] Mutual confirmation required for Inner Circle state.
- [ ] Signals weighting multiplier active (1.5x baseline).
- [ ] No dedicated Inner Circle UI tab.
- [ ] Hook visible in Add Contact modal.
- [ ] Build passes + UX parity across web + mobile.

---

**Summary:**  
Inner Circle becomes *invisible trust plumbing* across TrustMesh.  
It influences outcomes but doesn’t demand attention, serving as the social substrate beneath Contacts and Signals.

