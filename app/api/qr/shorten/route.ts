import { NextRequest } from "next/server";

const __qrStore: Map<string, { d: string; expiresAt: number }> = (global as any).__qrStore || new Map();
(global as any).__qrStore = __qrStore;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz"; // no ambiguous chars
function randCode(len = 7) {
  let out = "";
  const bytes = new Uint8Array(len);
  (globalThis.crypto || require("crypto").webcrypto).getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { d, ttl = 300 } = await req.json(); // ttl in seconds (default 5 min)
    if (!d || typeof d !== "string") {
      return new Response(JSON.stringify({ error: "missing d" }), { status: 400 });
    }
    const now = Date.now();
    // purge expired
    for (const [k, v] of __qrStore) if (v.expiresAt <= now) __qrStore.delete(k);

    let code = randCode();
    while (__qrStore.has(code)) code = randCode();

    const expiresAt = now + ttl * 1000;
    __qrStore.set(code, { d, expiresAt });
    return new Response(JSON.stringify({ code, expiresAt }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "bad_request" }), { status: 400 });
  }
}
