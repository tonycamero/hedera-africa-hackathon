const MIRROR = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com'

const mem: Record<string, { at: number; data: any[] }> = {}

export async function fetchTopicMessages(topicId: string, limit = 200, ttlMs = 5000) {
  const k = `${topicId}:${limit}`
  const now = Date.now()
  if (mem[k] && now - mem[k].at < ttlMs) return mem[k].data

  const url = `${MIRROR}/api/v1/topics/${topicId}/messages?limit=${limit}&order=desc` // Latest first
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Mirror ${res.status}`)
  const data = await res.json()
  const msgs = (data.messages || []).map((m: any) => {
    const utf8 = Buffer.from(m.message, 'base64').toString('utf8')
    let json: any = null
    try { 
      json = JSON.parse(utf8) 
    } catch {}
    return { ...m, decoded: utf8, json }
  })
  mem[k] = { at: now, data: msgs }
  return msgs
}