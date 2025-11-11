# XMTP V3 Migration Summary
**Status:** ✅ Complete  
**Branch:** feature/xmtp-v3-upgrade  
**SDK:** `@xmtp/browser-sdk` v5 (V3 protocol)  

---

## Overview
The XMTP integration has been upgraded from the deprecated V2 protocol (`@xmtp/xmtp-js` v13) to the new V3 protocol (`@xmtp/browser-sdk` v5).  
This aligns the TrustMesh codebase with XMTP's current supported standard (V2 officially deprecated May 1 2025).

---

## 🔄 Key Changes

### 1. SDK Replacement
| Before | After |
|--------|-------|
| `@xmtp/xmtp-js` v13 | `@xmtp/browser-sdk` v5 |
| Deprecated V2 protocol | Active V3 protocol |

The new SDK uses a WASM worker backend and an updated `Client.create` interface.

---

### 2. Simplified Signer Interface

Replaced the legacy `AbstractSigner` with XMTP v3's minimal interface:

```ts
{
  type: 'EOA',
  getIdentifier: () => ({
    kind: 'address',
    address: evmAddress.toLowerCase(),
  }),
  signMessage: async (msg: string) => Promise<Uint8Array>,
}
```

* Works directly with Magic.link's `rpcProvider.request('personal_sign', …)`
* Removes all ethers.js dependency for messaging auth
* Stateless and browser-safe

---

### 3. Updated Client Creation

```ts
const client = await Client.create(signer, {
  env: 'dev',
  dbPath: null, // in-memory store for browsers
});
```

**Notes**

* All client fields (`inboxId`, `accountAddress`) are now **async methods**.
* Uses ephemeral in-memory DB; no IndexedDB dependency.
* `Client.create()` automatically provisions inboxes for new users.

---

### 4. Webpack / Next.js Configuration

**`next.config.mjs`**

```js
export default {
  webpack: (config, { isServer }) => {
    // Enable WASM and async WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Exclude from server bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@xmtp/browser-sdk', '@xmtp/wasm-bindings');
    }

    return config;
  },
};
```

Enables WASM loading for XMTP's worker runtime and prevents server-bundle inclusion.

---

## ✅ What to Test

1. Start dev server → open browser console
2. Confirm:
   * `[XMTP] Initializing V3 client...`
   * `[XMTP] V3 Client initialized successfully`
3. Verify that:
   * `inboxId` and `address` appear in logs
   * No `503` or `V2 no longer available` errors
   * Magic.link sign-in + message send/receive flow works
   * Contact lookup and messaging features work correctly

---

## 🧩 Compatibility Notes

* All existing TrustMesh sidecar code (contacts, threads, composer) remains valid.
* HCS logic unchanged — messaging still runs in isolated sidecar mode.
* No server changes required.

---

## 🔖 Tag Recommendation

```bash
git add .
git commit -m "migrate: XMTP v2 → v3 protocol (@xmtp/browser-sdk v5)"
git tag xmtp-v3-migration
git push origin xmtp-v3-migration
```

---

## 📝 Files Modified

* `lib/xmtp/client.ts` - Replaced V2 client initialization with V3 API
* `next.config.mjs` - Added WASM support and server externalization

---

**Maintainer:** Scend Core / Warp QA  
**Version:** v0.2 – XMTP V3 Stable  
**Date:** 2025-11-09
