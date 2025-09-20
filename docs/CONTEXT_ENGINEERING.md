Here is your complete **Context Engineering Rulebook** for `v).dev` agents — synthesized from your original `CONTEXT_ENGINNERING.md` file and expanded into a **clear, agent-operable instruction manual** for building and maintaining the **Scend Context Engine** core.

---

# 🧠 TrustMesh Context Engineering Rulebook

### 📌 Purpose

**Trust is the new currency.** This rulebook defines how we build **chainproof credibility infrastructure** using the **Context Engine** as our operational core. No gatekeepers. No middlemen. Just **programmable trust** that flows.

---

## 🔁 Operating Thesis

The **Context Engine** is the **trust brain** of TrustMesh. It doesn't just process data—it **inscribes credibility** in real-time, routing trust signals through our three-loop system to create **verifiable proof of context**.

> **Your reputation is programmable.** The engine processes:

* A trust token exchange → triggers **chainproof verification**
* A badge claim → issues **non-transferable NFT** on Hedera
* A circle invitation → activates **mutual trust mechanics**

**QR to trust loop.** Every interaction matters.

---

## 🧱 Core Architecture

**Built different. Scales different.**

The **Context Engine** is the "loop brain" of all Scend applications. It interprets, routes, and acts on context objects flowing through the system — like messages, payments, or campaign engagement — to drive **trust**, **reputation**, and **autonomous flows**.

> Think of it as a **real-time interpreter for user and system behavior**, processing things like:

* A message requesting payment → triggers TRST transfer
* A payment with campaign ID → issues NFT reward
* An engagement action → triggers a campaign update and message

---

## 🧬 The 3 Core Context Loops

> **Messaging → Payments → Engagement.** Always build in this order. No shortcuts.

### 1. **Messaging Loop**

* Protocol: **XMTP** (because conversations should be owned by you)
* Triggers: Trust conversations, badge notifications, circle invites
* Types: Direct wallet-to-wallet, group trust, campaign flows
* **Flex Factor**: Every message can carry trust weight

\`\`\`ts
{
  type: "chat",
  payload: {
    threadId: "wallet:0xabc",
    action: "trust_signal",
    message: "You earned 10 TRST for that collab 🔥"
  },
  timestamp: 1680000000,
  source: "engagement-loop"
}
\`\`\`

---

### 2. **Payments Loop**

* Token: **TRST** (the trust currency that actually matters)
* Abstracted wallet: **MatterFi SDK** (invisible but powerful)
* Triggered via: Trust exchanges, badge claims, circle activations
* **Chainproof**: Every transaction is **verifiable proof of context**

\`\`\`ts
{
  type: "payment",
  payload: {
    to: "brale-address-123",
    amount: 10,
    reason: "Circle token exchange",
    trustLevel: "recognition"
  },
  timestamp: 1680000010,
  source: "messaging-loop"
}
\`\`\`

---

### 3. **Engagement Loop**

* Output: **Chainproof badges** (non-transferable, revocable, but **inscribed forever**)
* Triggers: QR scans, trust milestones, circle completions
* Tied to: **HCS10 topics** for immutable proof
* **Cultural Impact**: Badges that actually mean something

\`\`\`ts
{
  type: "engagement",
  payload: {
    badgeId: "hackathon-winner-2024",
    action: "mint",
    recipient: "0xuser",
    issuer: "verified-org"
  },
  timestamp: 1680000020,
  source: "payments-loop"
}
\`\`\`

---

## ⚙️ Design Principles

**We don't ask for trust. We define it.**

| Rule                             | Why It Matters                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| **Chainproof-first**             | Every trust signal gets **inscribed on Hedera**. No exceptions.                       |
| **Composable**                   | Build in modules, not monoliths. **Reputation is programmable.**                      |
| **Loop-driven**                  | Messaging → Payments → Engagement. **This order creates trust velocity.**             |
| **Invisible wallets**            | Users shouldn't "connect" anything. **MatterFi handles the crypto complexity.**       |
| **Context-first, not API-first** | **Trust flows through contexts**, not REST endpoints. Think streams, not requests.    |

---

## 🧰 Dev Workflow

**Earn your circle. Build the protocol.**

1. **Clone the trust layer** from `scend-agent-kernel`
2. **Messaging first** → Ensure `context/messaging/` processes trust conversations
3. **Add payments** → TRST flows trigger engagement via context routing
4. **Engagement layer** → Badge minting calls back into messaging for notifications
5. **Validate loops** → All three systems should **talk to each other seamlessly**
6. **Pattern library** → Add reusable components to `/patterns/` **only after loops work**
7. **Ship and inscribe** → Push updates with **HCS logging** for full transparency

---

## 🤖 Agent Handoff Protocol

**No context lost. Ever.**

If you're inheriting this codebase:

* ✅ **Verify the three loops exist** and process contexts correctly
* ✅ **Load `contextEngine.ts`** and confirm `.registerHandler()` entries work
* ✅ **Check `/context/messaging`, `/payments`, `/engagement`** folders
* ✅ **Confirm TRST integration** (not testnet tokens—the real deal)
* ✅ **Validate `ScendContext` types** are imported and working
* ❌ **Don't build extras** until the core trust loops are **chainproof**

---

## 📦 Context Object Schema

**The universal trust language.**

\`\`\`ts
interface ScendContext {
  type: "chat" | "payment" | "engagement";
  payload: Record<string, any>;
  timestamp: number;
  source?: string; // Which loop triggered this context
  trustLevel?: "contact" | "recognition" | "circle"; // Trust weight
  chainproof?: boolean; // HCS verification status
}
\`\`\`

**Every context flows through this shape.** No exceptions.

---

## 🛠 Core Utilities

**The trust toolkit.**

* `contextEngine.processContext(context: ScendContext)`
  * **Routes contexts to the right loop handler**
* `contextEngine.registerHandler("payment", handleTrustPayment)`
  * **Registers context types with processing functions**
* `registerHandlers()` → **Must run on app init** (trust doesn't wait)

---

## 🌐 Integration Standards

**Built on giants. Powered by trust.**

| Component           | Standard/Tool                                |
| ------------------- | -------------------------------------------- |
| Messaging           | **XMTP Protocol** (own your conversations)  |
| Payments            | **TRST token** via MatterFi or Brale        |
| NFTs / Identity     | **Hedera HCS10** topics and HTS tokens      |
| Reputation          | **Chainproof badges** (non-transferable)    |
| Identity Onboarding | **MatterFi** (invisible wallet magic)       |

---

## ⚡ Licensing

**This architecture is licensed to TrustMesh and authorized partners only.** 

**Trust doesn't need permission. But this code does.**

---

## 📚 Reference Links

* [Hedera SDK Docs](https://docs.hedera.com) → **Build on the trust layer**
* [XMTP Docs](https://xmtp.org/docs) → **Own your conversations**
* [Brale API](https://brale.xyz) → **TRST token infrastructure**
* [MatterFi SDK](internal) → **Invisible wallet magic**

---

> **Inscribed like it matters.**
> **Built on Hedera. For the culture.**
> **Your trust. Your chain.**

**Reputation is programmable. Start coding.**
