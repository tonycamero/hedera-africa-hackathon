import { NextRequest, NextResponse } from 'next/server'
import { submitToTopic } from '@/lib/hedera/serverClient'
import { getRegistryTopics } from '@/lib/hcs2/registry'
import { isValidBoostId } from '@/lib/ids/boostId'
import { guardContent, GENZ_TEMPLATES } from '@/lib/filters/contentGuard'

// Rate limiting for authenticated suggests
const rateLimiter = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // suggests per minute per user
const RATE_WINDOW = 60 * 1000

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimiter.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + RATE_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }
  
  record.count++
  return { allowed: true, remaining: RATE_LIMIT - record.count }
}

export async function POST(req: NextRequest) {
  try {
    // Check feature flag
    if (process.env.FEATURE_GZ_BOOST_API !== '1') {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 })
    }

    // Basic CSRF protection check
    const requestedWith = req.headers.get('X-Requested-With')
    if (requestedWith !== 'XMLHttpRequest') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { boostId, def_id, note, sessionId } = await req.json()
    
    // Validate required fields
    if (!boostId || !def_id) {
      return NextResponse.json({ error: 'Missing required fields: boostId, def_id' }, { status: 400 })
    }

    // Validate boost ID
    if (!isValidBoostId(boostId)) {
      return NextResponse.json({ error: 'Invalid boost ID format' }, { status: 400 })
    }

    // Validate def_id is from our template library
    const templateExists = GENZ_TEMPLATES.some(t => `grit.${t.id}@1` === def_id)
    if (!templateExists) {
      return NextResponse.json({ error: 'Invalid template definition ID' }, { status: 400 })
    }

    // Simple auth check - in production this would be proper JWT/session validation
    if (!sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate note content if provided
    if (note) {
      const contentCheck = guardContent('clutched', 'placeholder', note) // Just validate the note part
      if (!contentCheck.valid) {
        return NextResponse.json({ error: contentCheck.error }, { status: 400 })
      }
    }

    // Rate limiting per session
    const rateCheck = checkRateLimit(sessionId)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Slow down!' }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + RATE_WINDOW).toString()
          }
        }
      )
    }

    // Create signal.suggest@1 payload
    const suggestPayload = {
      t: 'signal.suggest@1',
      boost_id: boostId,
      def_id: def_id,
      note: note || '',
      suggester: sessionId,
      ts: Date.now()
    }

    // Create HCS envelope
    const envelope = {
      type: 'RECOGNITION_MINT', // Routes to recognition topic
      from: sessionId, // From the authenticated user
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: suggestPayload
    }

    // Get topics and submit to HCS
    const topics = await getRegistryTopics()
    const topicId = topics.recognition || '0.0.6895261'
    const message = JSON.stringify(envelope)
    const result = await submitToTopic(topicId, message)

    console.log(`[Suggest API] Success: boostId=${boostId}, def_id=${def_id}, from=${sessionId}`)

    return NextResponse.json(
      { 
        ok: true,
        boostId,
        def_id,
        transactionId: result.transactionId || result.sequenceNumber
      },
      {
        headers: {
          'X-RateLimit-Remaining': rateCheck.remaining.toString()
        }
      }
    )

  } catch (error: any) {
    console.error('[Suggest API] Error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}