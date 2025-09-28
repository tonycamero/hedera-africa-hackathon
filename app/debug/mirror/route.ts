import { NextRequest, NextResponse } from 'next/server'
import { MIRROR_REST, TOPIC } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    const topicId = '0.0.6896005' // Direct topic ID
    // Use fixed MIRROR_REST which should now include /api/v1
    const url = `${MIRROR_REST}/topics/${topicId}/messages?limit=5&order=desc`
    
    console.log(`[Mirror Test] Testing URL: ${url}`)
    console.log(`[Mirror Test] MIRROR_REST: ${MIRROR_REST}`)
    console.log(`[Mirror Test] process.env.NEXT_PUBLIC_MIRROR_NODE_URL: ${process.env.NEXT_PUBLIC_MIRROR_NODE_URL}`)
    console.log(`[Mirror Test] TOPIC: ${JSON.stringify(TOPIC)}`)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrustMesh/1.0'
      }
    })
    
    console.log(`[Mirror Test] Response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        url,
        errorText
      }, { status: 500 })
    }
    
    const data = await response.json()
    console.log(`[Mirror Test] Messages received: ${data.messages?.length || 0}`)
    
    const processed = (data.messages || []).slice(0, 3).map((msg: any) => {
      try {
        const decoded = Buffer.from(msg.message || '', 'base64').toString('utf8')
        const parsed = JSON.parse(decoded)
        return {
          sequence: msg.sequence_number,
          timestamp: msg.consensus_timestamp,
          type: parsed.type,
          actor: parsed.actor || parsed.from,
          target: parsed.target || parsed.to
        }
      } catch (e: any) {
        return {
          sequence: msg.sequence_number,
          error: e.message,
          rawMessage: (msg.message || '').substring(0, 50)
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      url,
      messagesCount: data.messages?.length || 0,
      processed,
      environment: {
        MIRROR_REST,
        TOPIC_CONTACTS: TOPIC.contacts,
        NODE_ENV: process.env.NODE_ENV
      }
    })
    
  } catch (error: any) {
    console.error('[Mirror Test] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}