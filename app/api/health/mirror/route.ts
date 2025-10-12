import { NextResponse } from "next/server";

export async function GET() {
  const url = (process.env.NEXT_PUBLIC_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com/api/v1').replace(/\/+$/,'');
  const r = await fetch(`${url}/network/nodes`, { cache: 'no-store' });
  return NextResponse.json({ ok: r.ok, status: r.status });
}