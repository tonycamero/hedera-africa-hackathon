type HcsEvent = {
  type: string
  accountId: string
  payload: Record<string, unknown>
  iat: string // ISO timestamp
}

/**
 * HCS-21 Event Publisher
 * 
 * Publishes lens unlock/switch events to HCS topic for audit trail
 * 
 * TODO: Integrate with Hedera SDK when topics are configured
 */
export async function publishHcs21(evt: HcsEvent) {
  const topic = process.env.NEXT_PUBLIC_TOPIC_RECOGNITION_BASE
  
  if (!topic) {
    console.warn('[HCS-21] Topic not configured, using mock')
  }

  // TODO: Hedera SDK submitMessage
  // await new TopicMessageSubmitTransaction()
  //   .setTopicId(topic)
  //   .setMessage(JSON.stringify(evt))
  //   .execute(client)

  // Mock for now
  const mockConsensusTime = new Date().toISOString()
  
  console.log('[HCS-21] Mock event published:', {
    topic: topic || 'mock-topic',
    type: evt.type,
    accountId: evt.accountId,
    payload: evt.payload,
    consensusTime: mockConsensusTime
  })

  return { 
    topic: topic || 'mock-topic', 
    consensusTime: mockConsensusTime 
  }
}
