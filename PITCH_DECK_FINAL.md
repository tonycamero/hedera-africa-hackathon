# **TrustMesh Pitch Deck**

## **Hedera Africa Hackathon 2025**

---

## **Slide 1: The Trust Gap**

**Africa's students have trust — but institutions can't see it.**

* 500M students, zero credit history  
* Informal trust exists but isn't portable  
* No verified skills, no access to loans or jobs

*What if trust could move with you?*

---

## **Slide 2: Introducing TrustMesh**

**Portable, programmable trust built on-chain.**

* Recognition NFTs from peers, professors, orgs  
* Circle of 9 creates scarcity and signal value  
* Trust score updates in real time

*Built on Hedera for speed, cost, and transparency.*

---

## **Slide 3: What Students Can Do**

**One simple interface to build and share trust.**

* Send signals → mint recognition (0.01 TRST)  
* Allocate trust to close peers (Circle of 9\)  
* Export Flex Portfolio (QR \+ PDF)  
* Click to verify on HashScan

*135 free mints to start. Then 0.01 TRST each.*

---

## **Slide 4: Campus-First Strategy**

**Trust networks form naturally at universities.**

* Peer signals \+ faculty validation  
* Local viral loops via referrals  
* No surveillance, just attestations

*We start small, grow wide.*

---

## **Slide 5: Amara's Journey**

**A student in Ghana turns trust into opportunity.**

* Earns badges from events, professors  
* Builds Circle of 9  
* Applies for internship with verified credentials  
* Refers friends → her network grows

*Trust becomes spendable reputation.*

---

## **Slide 6: Why Now?**

**Africa can leapfrog legacy systems.**

* 70% informal workforce  
* Mobile-first, youth-dominant (median age 19\)  
* $2.3B fintech \+ alt-credit market

*The infrastructure is behind. The trust isn't.*

---

## **Slide 7: Why Hedera?**

**ABFT finality prevents retroactive trust manipulation.**

* Sub-$0.01 fees enable viral social mechanics  
* Carbon-negative consensus aligns with African values  
* Governance prevents platform capture

*Hedera isn't just faster—it's the only network where bounded trust systems scale economically.*

---

## **Slide 8: Roadmap**

**From campus to credit to commerce.**

* **Now:** Targeting \>3 pilot universities  
* **Next:** Employer-facing verifications  
* **Future:** Credit scoring \+ remittance trust

*Start with students. Scale to the continent.*

---

## **Slide 9: Early Traction**

**67 days, 300+ commits, production-ready.**

* \~125K lines of code  
* HCS-22 identity binding (FIRST ecosystem implementation)  
* 84 Recognition Signals in 5 categories  
* 53 Gen-Z hashinal cards and **viral *boost*** mechanisms  
* Sub-2s consensus validated

*Aspirational but already in motion.*

---

## **Slide 10: Build the Reputation Layer for Africa**

**Trust is a currency. Let's make it spendable.**

* Open to pilots, research partners, early funders  
* Unlock reputation in places data can't reach

**CTA: Join us — trust that travels.** 🔥

---

# **APPENDIX: Technical & Compliance**

---

## **A1: Business Model Detail**

**Pure token economy: 0.01 TRST per recognition mint.**

* **Who Pays:** Users (micro-fees), Universities (bulk TRST), Employers (verification)  
* **Pricing:** 135 free mints \= $1.35 CAC, then 0.01 TRST each  
* **Scale:** 100K users \= $120K/yr | 10M users \= $12M/yr

**Financial Flow:**

* User → Mint → 0.01 TRST burned → Protocol revenue  
* Campus → Bulk purchase → Student engagement  
* Employer → Credential access → Verification fees

---

## **A2: Market Sizing (TAM/SAM/SOM)**

**Total Addressable Market: $2.3B**

* Africa fintech, 25% annual growth  
* 400M+ excluded adults, 150M SMBs

**Serviceable Addressable: $850M**

* 27M university students across Africa  
* Young professionals, cross-border traders

**Serviceable Obtainable: $120M (Yr 1-3)**

* 4 pilot universities, 100K students initially  
* Campus-to-campus viral growth

---

## **A3: Tokenomics**

**TRST: Utility stablecoin for TrustMesh economy.**

- **USD-backed:** 1:1 peg, fungible/redeemable
- **Utility:** Micropayments per recognition mint (0.01 TRST)
- **Onboarding:** 135 free TRST ($1.35 CAC)
- **Top-up:** HBAR or USDC → instant TRST conversion
* Campus program funding

---

## **A4: Team**

**The Convergence**

* **Tony Camero:** CraftTrust (2023 Hashgraph grant), 15+ yrs fintech  
* **Hadiatou:** Genesis moment—spotted hackathon, identified universal need  
* **Kabiru:** "Giggle moment" → researched → rebuilt it right  
* **Tim:** OG Hedera (Hbar Foundry Fridays), cultural authenticity

*Direct experience with excluded economies. Production validation. Cultural depth.*

---

## **A5: Architecture**

**Data Flow:**

Next.js Frontend  
    ↓ (optimistic updates)  
SignalsStore (state)  
    ↑ (REST \+ WebSocket)  
Mirror Node  
    ↑ (TopicMessageSubmit)  
Hedera Consensus Service  
(5 HCS topics \+ HTS TRST)

**Integration Points:**

* HCS Topics: Profile, Contact, Trust, Signal, Identity (HCS-22)  
* HTS Token: 0.0.5361653 (testnet)  
* Mirror Node: Sub-2s real-time sync

**TRL: Prototype (4-6)** — End-to-end working, testnet validated

---

## **A6: Deployment Timeline**

**Africa → USA → Global scale**

**Months 1-2 (Mainnet Launch):**
- Migrate 5 HCS topics testnet → mainnet
- Production monitoring (99.9% uptime SLA)
- Security audit + TRST mainnet deployment

**Months 3-6 (Africa Campus Pilots):**
- 3 universities: Ghana, Kenya, South Africa
- 3K students, faculty validation partnerships
- Campus ambassador programs

**Months 6-12 (USA Expansion):**
- **24 college communities** (academic + civic deployments)
- **POS TRST payments** (bookstores, dining, events) 💰
- Cross-campus trust portability
- Employer credential verifications

**Months 12-24 (Economic Integration):**
- Trust-based credit scoring (financial partners)
- SMB trade networks (cross-border commerce)
- Professional networks (LinkedIn-style)
- Remittance trust layer

*Built for Africa. Scaling globally. Real payments, real economy.*

---

**Contact:** \[Email/DoraHacks\]

**Demo:** \[Video link\]

**Code:** github.com/tonycamero/hedera-africa-hackathon
