const MIRROR_BASE = process.env.HEDERA_MIRROR_BASE || 'https://testnet.mirrornode.hedera.com'

export async function getHBARBalance(accountId: string): Promise<number> {
  const url = `${MIRROR_BASE}/api/v1/accounts/${accountId}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Mirror ${res.status}`)
  const data = await res.json()
  // hbar tinybars to HBAR
  return (Number(data.balance?.balance ?? 0) / 1e8)
}
