type Envelope = {
  type: string
  from: string
  nonce: number
  ts: number
  payload: Record<string, any>
}

async function publish(envelope: Envelope) {
  const res = await fetch('/api/hcs/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(envelope),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Submit failed')
  }
  return await res.json() // { ok, topicId, consensusTimestamp, sequenceNumber }
}

// Helper to create recognition mint envelope
export async function publishRecognitionMint(from: string, to: string, recognitionType: string) {
  const envelope: Envelope = {
    type: 'RECOGNITION_MINT',
    from,
    nonce: Date.now(), // TODO: Use proper incrementing nonce in production
    ts: Math.floor(Date.now() / 1000),
    payload: {
      definitionId: recognitionType,
      name: recognitionType,
      to,
      mintedBy: from
    },
  }
  return await publish(envelope)
}

// Helper to create trust allocation envelope
export async function publishTrustAllocation(from: string, to: string, weight: number) {
  const envelope: Envelope = {
    type: 'TRUST_ALLOCATE',
    from,
    nonce: Date.now(),
    ts: Math.floor(Date.now() / 1000),
    payload: {
      to,
      weight,
      reason: 'circle_allocation'
    },
  }
  return await publish(envelope)
}

export { publish }
export type { Envelope }