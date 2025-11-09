import { NextRequest, NextResponse } from 'next/server'
import { submitToTopic } from '@/lib/hedera/serverClient'
import { getRegistryTopics } from '@/lib/hcs2/registry'
import { isValidBoostId } from '@/lib/ids/boostId'

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimiter = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30 // requests per minute per IP+boostId
const RATE_WINDOW = 60 * 1000 // 1 minute

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

    const { boostId } = await req.json()
    
    // Validate boost ID
    if (!boostId || !isValidBoostId(boostId)) {
      return NextResponse.json({ error: 'Invalid boost ID format' }, { status: 400 })
    }

    // Enhanced rate limiting per IP + boostId with device fingerprinting
    const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const deviceHash = Buffer.from(`${clientIP}:${userAgent}`).toString('base64').slice(0, 8)
    const rateLimitKey = `${deviceHash}:${boostId}`
    const rateCheck = checkRateLimit(rateLimitKey)
    
    if (!rateCheck.allowed) {
      console.warn(`[Boost API] Rate limit exceeded for ${deviceHash} on ${boostId}`)
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + RATE_WINDOW).toString(),
            'Retry-After': Math.ceil(RATE_WINDOW / 1000).toString()
          }
        }
      )
    }

    // Create signal.boost@1 payload
    const boostPayload = {
      t: 'signal.boost@1',
      boost_id: boostId,
      anon: true,
      ts: Date.now()
    }

    // Create HCS envelope
    const envelope = {
      type: 'RECOGNITION_MINT', // Routes to recognition topic
      from: '0.0.5864559', // Operator account for anonymous boosts
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: boostPayload
    }

    // Get topics and submit to HCS
    const topics = await getRegistryTopics()
    const topicId = topics.recognition || '0.0.6895261'
    const message = JSON.stringify(envelope)
    const result = await submitToTopic(topicId, message)

    console.log(`[Boost API] Success: boostId=${boostId}, seq=${result.sequenceNumber}`)

    return NextResponse.json(
      { 
        ok: true, 
        boostId,
        tally: Math.floor(Math.random() * 10) + 1 // Optimistic server-side tally (placeholder)
      },
      {
        headers: {
          'X-RateLimit-Remaining': rateCheck.remaining.toString()
        }
      }
    )

  } catch (error: any) {
    console.error('[Boost API] Error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}