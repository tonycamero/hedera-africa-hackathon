# ??? Hackathon Strategy & Milestones � TrustMesh

This doc defines the full-stack build plan for the hackathon demo � the functional scope, team distribution, stretch targets, and DevOps flow. It balances the visionary TrustMesh ethos with pragmatic constraints of a hackathon sprint.

---

## 1. ?? Hackathon Goal

Build a working TrustMesh MVP that:

* Issues trust badges on-chain (Hedera HCS)
* Visualizes Circle of Trust + badge explorer
* Enables QR-based badge claiming
* Exports shareable Flex Portfolios
* Logs every event to HCS for public transparency

Stretch:

* Trust score preview
* Issuer dashboard
* Revocation flow
* Institutional onboarding

---

## 2. ?? Roles & Responsibilities

### Backend (Kabru)

* Hedera HCS integration
* Trust token issuance (HCS NFT)
* Event logging: mint, revoke, accept
* Badge metadata storage (JSON schema)
* Wallet integration (via MatterFi abstraction)

### Frontend (Tim + Hadi)

* Claim flow (QR ? badge ? confirm)
* Profile builder UI (Flex Portfolio)
* Circle of Trust visualization
* Badge explorer grid
* Dark mode, mobile-first layout

### Infra / DevOps (Tony)

* Replit/Netlify deployment pipeline
* API key + secrets mgmt
* Hedera testnet observability
* Fallback flows (mocked wallet)

---

## 3. ?? MVP Feature Scope

### ? Real Features

* Trust badge minting (HCS NFT)
* QR scan ? claim flow
* Badge gallery / explorer
* HCS event logging
* Circle of Trust graph view

### ?? Mocked Flows

* Trust score calculator
* Issuer dashboard
* Revocation mechanics
* Org onboarding screen
* TRST payment buttons

---

## 4. ?? Timeline

> Note: Hackathon runs through **September**, allowing extended time for polish, QA, and potential stretch goal fulfillment.

### Phase 1: Infra & QR Demo (Weeks 1�2)

* DevOps setup (Netlify + Replit + keys)
* Generate test QR flows (badge claim)
* Initial event logs ? Hedera console
* Basic explorer UI

### Phase 2: MVP Core Assembly (Weeks 3�4)

* Mint ? Claim ? Explorer UI ? Profile
* Circle of Trust logic + visual
* Shareable Flex Portfolios live
* Hedera event persistence end-to-end

### Phase 3: Mocked Systems + Stretch Features (Weeks 5�6)

* Mocked trust score calculator
* Issuer dashboard + onboarding flows
* Revocation logic UI
* Dark/light theme toggle
* Profile exports

### Phase 4: QA, Stress Testing, Launch Readiness (Weeks 7�8+)

* Hedera testnet load test
* Bug hunts + fallback validation
* CI hardening + logs
* Final deploy + presentation script polish

---

## 5. ?? DevOps Checklist

� Provision Hedera testnet keys

� Finalize badge metadata schema

� Set up Netlify deploy URL + status page

� Mock fallback flow for MatterFi wallet

� Integrate QR code generation library

� Configure CI checks for HCS event failover

� Monitor event logs in Hedera console

---

## 6. ?? Hackathon Demo Walkthrough (Live Script)

1. Scan QR code at campus event
2. Claim badge: �I attended TrustSprint kickoff�
3. See badge logged to Hedera
4. Add 3 friends to Circle of Trust
5. Flex: open portfolio, show trust score preview
6. Share exportable link with judge

---

## 7. ?? Success Criteria

* 100+ badge mints on testnet
* 25+ Circle of Trust connections
* MVP fully hosted and demoable
* At least 1 mocked feature live
* Institutional onboarding mocked or functional
* TrustMesh demo wins mindshare

> This isn�t just a demo. It�s a signal: trust can be programmable � and verifiable � by anyone.

---

