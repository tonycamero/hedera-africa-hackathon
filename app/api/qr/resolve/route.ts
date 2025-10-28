import { NextRequest } from "next/server";

const __qrStore: Map<string, { d: string; expiresAt: number }> = (global as any).__qrStore || new Map();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("c") || "";
  const row = __qrStore.get(code);
  if (!row) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
  if (row.expiresAt <= Date.now()) {
    __qrStore.delete(code);
    return new Response(JSON.stringify({ error: "expired" }), { status: 410 });
  }
  return new Response(JSON.stringify({ d: row.d, expiresAt: row.expiresAt }), { headers: { "Content-Type": "application/json" } });
}
