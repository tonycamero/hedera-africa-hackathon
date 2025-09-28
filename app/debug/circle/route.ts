import { NextRequest, NextResponse } from 'next/server'
import { TOPIC } from '@/lib/env'

// Direct Mirror Node fetch to test connectivity and data format
async function testMirrorNodeFetch(topicId: string, limit = 10) {
  const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=${limit}&order=desc`
  
  try {
    const response = await fetch(mirrorUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrustMesh/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      success: true,
      count: data.messages?.length || 0,
      messages: data.messages?.slice(0, 3).map((msg: any) => ({
        sequence: msg.sequence_number,
        timestamp: msg.consensus_timestamp,
        decoded: Buffer.from(msg.message, 'base64').toString('utf8')
      })) || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test registry config
    const registryResponse = await fetch('http://localhost:3000/api/registry/config')
    const registryData = await registryResponse.json()
    
    // Test Mirror Node connectivity for each topic
    const topics = [TOPIC.contacts, TOPIC.trust, TOPIC.profile, TOPIC.recognition].filter(Boolean)
    const mirrorResults = await Promise.all(
      topics.map(async (topic) => ({
        topic,
        result: await testMirrorNodeFetch(topic, 5)
      }))
    )
    
    // Analyze the first few decoded messages to check format
    const sampleMessages: any[] = []
    for (const { topic, result } of mirrorResults) {
      if (result.success && result.messages.length > 0) {
        for (const msg of result.messages) {
          try {
            const parsed = JSON.parse(msg.decoded)
            sampleMessages.push({
              topic,
              sequence: msg.sequence,
              timestamp: msg.timestamp,
              type: parsed.type,
              actor: parsed.actor || parsed.from,
              target: parsed.target || parsed.to,
              hasMetadata: !!parsed.metadata,
              hasPayload: !!parsed.payload,
              originalFormat: Object.keys(parsed)
            })
          } catch (parseError) {
            sampleMessages.push({
              topic,
              sequence: msg.sequence,
              error: 'JSON parse failed',
              raw: msg.decoded.substring(0, 100)
            })
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      registry: {
        available: registryResponse.ok,
        data: registryData
      },
      topics: {
        configured: topics,
        count: topics.length
      },
      mirrorNode: {
        results: mirrorResults,
        totalMessages: mirrorResults.reduce((sum, { result }) => 
          sum + (result.success ? result.count : 0), 0
        )
      },
      sampleMessages: {
        count: sampleMessages.length,
        data: sampleMessages.slice(0, 5) // Show first 5 for analysis
      }
    }, { status: 200 })
    
  } catch (error: any) {
    console.error('[Debug Circle] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}