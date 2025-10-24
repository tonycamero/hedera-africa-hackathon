# MatterFi Integration Pack v1

**Project:** CraftTrust × TrustMesh × TRST
**Scope:** Wallet + Identity, Payments, Custodial Mint (Brinks), Multi‑Facility Treasury, Audit/Compliance
**Audience:** Warp, Mehow, internal Scend engineering
**Date:** Oct 2025

---

## 0) Integration Goal (TL;DR)

Enable **cash → TRST mint → wallet distribution → payments → audit** using **MatterFi SDK** as the custody/identity/payments bridge, with **Brinks** providing cash custody proofs and **TrustMesh** providing recognition/attestation context.

---

## 1) Hedera Network Config (Testnet)

```ts
// matterfi.config.ts
export const matterfiConfig = {
  network: "hedera-testnet",        // confirm exact enum/name with Mehow
  hts: {
    trstTokenId: "0.0.xxxxx",        // TRST testnet token id
  },
  mirror: "https://testnet.mirrornode.hedera.com",
};
```

**Env (server)**

```
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxxx
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HCS_RECOGNITION_TOPIC=0.0.xxxxxx
MATTERFI_ORGANIZATION_ID=org_xxx
MATTERFI_API_KEY=sk_xxx
```

**Env (client)**

```
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HCS_RECOGNITION_TOPIC=0.0.xxxxxx
NEXT_PUBLIC_TRST_TOKEN_ID=0.0.xxxxx
```

---

## 2) SDK Modules (we will call)

* **Wallets**: create/import, bind to Magic.link user, resolve handles (send‑to‑name)
* **Transfers**: HTS token transfers (TRST), memos/metadata, history
* **Custodial Mint**: server‑side mint with custody proof (Brinks)
* **Organizations**: list wallets by facility, bulk ops if available
* **Audit/Webhooks**: subscribe to mints/transfers for compliance dashboard

> **Open items to confirm:** exact method names/signatures. See question pack at the end.

---

## 3) Core Interfaces (CraftTrust side)

```ts
// ports/SettlementPort.ts
export interface SettlementPort {
  mintToSpace(space: string, amount: string, meta?: any): Promise<{ txId: string }>
  transferBetweenSpaces(from: string, to: string, amount: string, meta?: any): Promise<{ txId: string }>
  getSpaceBalance(space: string): Promise<{ available: string }>
}

// adapters/MatterFiSettlementAdapter.ts
export class MatterFiSettlementAdapter implements SettlementPort {
  constructor(private cfg: { orgId: string; trstTokenId: string }) {}

  async mintToSpace(space: string, amount: string, meta?: any) {
    // 1) verify Brinks custody proof (server) → 2) call MatterFi mint
    const proof = await loadBrinksProof(space, amount);
    const res = await matterfi.mintAsset({
      organizationId: this.cfg.orgId,
      asset: { type: "HTS", tokenId: this.cfg.trstTokenId },
      destination: await resolveSpaceWallet(space),
      amount,               // as string, smallest units if required
      metadata: meta,       // { context, reason, proofHash }
      custodyProof: proof,  // opaque object; schema confirmed with Mehow
    });
    return { txId: res.txId };
  }

  async transferBetweenSpaces(from: string, to: string, amount: string, meta?: any) {
    const fromWallet = await resolveSpaceWallet(from);
    const toWallet   = await resolveSpaceWallet(to);
    const res = await matterfi.transfer({
      from: fromWallet,
      to: toWallet,
      asset: { type: "HTS", tokenId: this.cfg.trstTokenId },
      amount,
      memo: meta?.reason ?? "crafttrust-settlement",
      meta,
    });
    return { txId: res.txId };
  }

  async getSpaceBalance(space: string) {
    const wallet = await resolveSpaceWallet(space);
    const bal = await matterfi.getBalance({ walletId: wallet, asset: { type: "HTS", tokenId: this.cfg.trstTokenId }});
    return { available: bal.available };
  }
}
```

---

## 4) Wallet + Identity Flows

### 4.1 Magic.link → MatterFi wallet bind (client + server)

```ts
// client: after Magic login
const { didToken, user } = await magic.user.getIdToken();
await fetch("/api/matterfi/session", { method: "POST", headers: { Authorization: `Bearer ${didToken}` } });

// server: create/retrieve MatterFi wallet for this user
export async function POST(req: NextRequest) {
  const user = await verifyMagic(req.headers.get("authorization"));
  const wallet = await matterfi.wallets.create({
    ownerExternalId: user.id,       // or user.email
    keyType: "ed25519",
    network: "hedera-testnet",
    labels: ["crafttrust", user.email],
  });
  return NextResponse.json({ walletId: wallet.id });
}
```

**Open items to confirm:** whether `wallets.create` is idempotent by `ownerExternalId`, and the exact param names.

### 4.2 Handle resolution (send‑to‑name)

```ts
const res = await matterfi.resolveHandle({ handle: "@dispensary-1" });
// → { accountId: "0.0.xxxxxx", walletId: "w_abc", network: "hedera-testnet" }
```

---

## 5) Payments / Transfers (TRST)

```ts
const tx = await matterfi.transfer({
  from: "w_from",
  to:   "w_to",
  asset: { type: "HTS", tokenId: cfg.trstTokenId },
  amount: "125.00",                           // confirm decimal vs tiny units
  memo: "customer cash deposit",
  meta: {
    context: "crafttrust.dispensary-1",
    reason: "brinks-cash-on",
    proof:  "sha256:abc123..."                 // Brinks receipt hash
  }
});
```

**History**

```ts
const txs = await matterfi.getTransactions({ walletId: "w_from", asset: cfg.trstTokenId, limit: 50 });
// Expect meta/memo surfaced; confirm exact shape
```

---

## 6) Custodial Mint (Brinks) – Server Flow

**Actors:** Brinks → CraftTrust server → MatterNode/MatterAuditor → Mint

1. **Brinks cash-in** → webhook POST to CraftTrust with receipt payload & hash
2. CraftTrust verifies, stores proof, and calls **MatterFi `mintAsset()`**
3. MatterFi Auditor validates custody proof → submits HTS mint (or mints from pool)
4. On success, webhook/event → CraftTrust compliance log + UI update

```ts
// /api/brinks/webhook (server)
export async function POST(req: NextRequest) {
  const receipt = await verifyBrinksSignature(await req.json());
  const proof   = makeCustodyProof(receipt); // schema TBD with Mehow

  const res = await matterfi.mintAsset({
    organizationId: process.env.MATTERFI_ORGANIZATION_ID!,
    asset: { type: "HTS", tokenId: cfg.trstTokenId },
    destination: await resolveSpaceWallet(receipt.space),
    amount: receipt.amount,
    metadata: { context: receipt.space, reason: "cash-in", proofHash: proof.hash },
    custodyProof: proof,
  });

  await auditLog("mint", { receipt, res });
  return NextResponse.json({ ok: true, txId: res.txId });
}
```

**Open items to confirm:** `custodyProof` schema, success/failure event webhooks, and whether mint is HTS or pool‑based credit on their side.

---

## 7) Multi‑Facility Treasury (Organizations)

* We model each facility as a **space** → maps to a MatterFi `walletId` under one `organizationId`.
* Needed endpoints:

  * `organizations.listWallets(orgId)`
  * `balances.aggregate(orgId, asset)`
  * (Optional) `transferBatch([...])`

**Query pattern**

```ts
const wallets = await matterfi.organizations.listWallets({ organizationId: orgId, tag: "crafttrust" });
const balances = await Promise.all(
  wallets.map(w => matterfi.getBalance({ walletId: w.id, asset: { type: "HTS", tokenId: cfg.trstTokenId }}))
);
```

---

## 8) Audit / Compliance

* Subscribe to **webhooks** for `mint`, `transfer`, `burn`, `fail`.
* Verify signatures on incoming events; store to compliance DB table (`ot_events`).
* Render admin ledger: date, space, counterparty, amount, txId, meta.proofHash.

```ts
// /api/matterfi/webhook (server)
export async function POST(req: NextRequest) {
  const raw = await req.text();
  verifyMatterfiSignature(req.headers, raw);
  const evt = JSON.parse(raw);
  await complianceIngest(evt);
  return new Response("ok");
}
```

---

## 9) Health & Observability

* `/api/health/hcs` → mirror reachability + topic
* `/api/health/matterfi` → SDK auth ok, list 1 wallet
* `GET /api/hcs/messages` (server → mirror) with base64 decode + empty‑state truthy

**Empty‑state rule:** UI must show **"No signals yet"** if list is empty (no infinite spinner).

---

## 10) Testing Checklist (Deterministic)

1. **Env contract** unified (`NEXT_PUBLIC_HCS_RECOGNITION_TOPIC` etc.)
2. **Create wallet** via Magic → MatterFi; idempotent by external user id
3. **Seed mint** using fake Brinks payload on testnet → TRST balance updates
4. **Transfer** TRST between two spaces; memo/meta visible in history
5. **Webhook** arrives + passes signature verify; event stored
6. **Compliance UI** shows mint/transfer with proofHash

---

## 11) Example Payloads

```json
// Brinks receipt → custody proof source
{
  "space": "crafttrust.dispensary-1",
  "amount": "1500.00",
  "receiptId": "BRX-2025-10-03-0001",
  "timestamp": "2025-10-03T21:12:11Z",
  "checksum": "sha256:...",
  "signature": "brinks-ed25519:..."
}
```

```json
// Transfer meta attached to memo/meta
{
  "context": "crafttrust.dispensary-1",
  "reason": "customer cash deposit",
  "proof": "sha256:..."
}
```

---

## 12) Question Pack for Mehow (exact asks)

**Wallet & Identity**

* Sample for `wallets.create({...})` (params + return) and idempotency by `ownerExternalId`.
* Function to link Magic session → wallet; handle resolution API name (`resolveHandle`).

**Transfers / History**

* Full `transfer()` payload for **HTS (TRST)**, memo size limits, `meta` field availability.
* `getTransactions()` return shape and filtering (by asset, date, counterparty).

**Custodial Mint**

* `mintAsset()` signature and **`custodyProof` schema** for Brinks receipts; event sequencing Auditor→Mint.
* Where to attach proof hash (memo vs metadata) for later retrieval.

**Organizations / Bulk**

* List wallets by `organizationId`, aggregate balances, any `transferBatch`.

**Audit / Webhooks**

* Event types + JSON schema, signature verification doc, replay protection.

**Network Config**

* Exact enum/values for **hedera-testnet** + token decimals/units conventions for HTS.

---

## 13) Next Steps

1. Confirm TRST **testnet token id** and decimals
2. Fill adapter stubs once method names are confirmed
3. Stand up `/api/brinks/webhook` and `/api/matterfi/webhook`
4. Run the Testing Checklist and capture short videos/screens for Mehow
5. Lock pilot dates and add investor addendum (Funding = Brinks go‑live)

---

**Appendix:** If MatterFi exposes a GraphQL or REST surface in addition to the SDK, mirror the above with endpoint URLs for CI tests (postman/newman).

## 14) Settlement Architecture Note

### Current Constraint

Hedera's `CryptoCreate` throttling and HTS mint throughput limits prevent direct on‑chain settlement of TRST on Hedera for now.

### Interim Design

* **Custody / Identity / Compliance** remain on **Hedera + MatterFi** for proof anchoring, handle resolution, and organizational wallet mapping.
* **Settlement (mint / transfer / burn)** executes on an **EVM network** (Polygon or Base) through MatterFi's EVM adapters.

### Dual‑Token Model

1. **TRST‑H (Hedera HTS)** – canonical audit token, minimal volume; represents verified supply.
2. **TRST‑E (EVM)** – operational token on Polygon/Base used for live transactions; 1:1 backed by custodial proofs.

### Flow Summary

1. Brinks custody proof → submitted to MatterFi → triggers mint on EVM (Polygon/Base).
2. MatterNode notarizes event → logs proof hash to Hedera HCS.
3. Transfers and redemptions occur on EVM network.
4. MatterFi Auditor posts periodic reconciliation to Hedera ledger (total supply + proofs).

### Developer Impact

* `MatterFiSettlementAdapter` should invoke **EVM‑based SDK endpoints** for token operations.
* Hedera remains the audit and proof backbone (no end‑user settlement there until throttling resolved).
* When Hedera constraints lift, switch the `network` parameter from `polygon` or `base` back to `hedera` with no structural change to wallets or proofs.