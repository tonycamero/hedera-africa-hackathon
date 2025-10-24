import { NextRequest, NextResponse } from 'next/server';
import { submitToTopic } from '@/lib/hedera/serverClient';
import { getRegistryTopics } from '@/lib/hcs2/registry';
import {
  validateRecognition,
  createRecognitionEnvelope,
  type TMRecognitionV1,
  type LensType
} from '@/lib/v2/schema/tm.recognition@1';
import { z } from 'zod';

/** ===== Constants & simple in-memory stores (prod -> Redis/KV) ===== */
const RATE_LIMIT = 10;                // requests/min per sender
const RATE_WINDOW_MS = 60_000;
const IDEMPOTENCY_TTL_MS = 15 * 60_000;

type RateRec = { count: number; resetAt: number };
const rateLimiter = new Map<string, RateRec>();
const idemCache = new Map<string, { ts: number; response: any }>();

/** ===== Helpers ===== */
function now() { return Date.now(); }

function allowOrigin(req: NextRequest, allowed: string[]): boolean {
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';
  return allowed.some(a => origin.startsWith(a) || referer.startsWith(a));
}

function checkRate(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const t = now();
  const rec = rateLimiter.get(key);
  if (!rec || t >= rec.resetAt) {
    const next: RateRec = { count: 1, resetAt: t + RATE_WINDOW_MS };
    rateLimiter.set(key, next);
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: next.resetAt };
  }
  if (rec.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: rec.resetAt };
  }
  rec.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - rec.count, resetAt: rec.resetAt };
}

/** Tiny GC so the maps don't grow forever in dev */
function gcMaps() {
  const t = now();
  for (const [k, v] of rateLimiter) if (t > v.resetAt + 5 * RATE_WINDOW_MS) rateLimiter.delete(k);
  for (const [k, v] of idemCache) if (t - v.ts > IDEMPOTENCY_TTL_MS) idemCache.delete(k);
}

/** ===== Input schema ===== */
const BodySchema = z.object({
  spaceId: z.string().min(3),
  senderId: z.string().min(3),
  recipientId: z.string().min(3),
  lens: z.enum(['genz', 'professional', 'social', 'builder'] satisfies LensType[]),
  metadata: z.record(z.any()),
  hcsTopicId: z.string().optional(),
  correlationId: z.string().optional()
});

/** Resolve recognition topic with sane fallback order */
async function resolveTopic(bodyTopic?: string) {
  const topics = await getRegistryTopics().catch(() => ({} as any));
  return topics?.recognition || bodyTopic || process.env.DEFAULT_RECOGNITION_TOPIC || '';
}

/** Idempotency: prefer header, fall back to correlationId */
function getIdemKey(req: NextRequest, parsed: z.infer<typeof BodySchema>) {
  const hdr = req.headers.get('Idempotency-Key') || req.headers.get('idempotency-key');
  return hdr || (parsed.correlationId ? `cid:${parsed.correlationId}` : '');
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.FEATURE_TRUSTMESH_V2_ENGINE !== '1') {
      return NextResponse.json({ error: 'TrustMesh v2 engine not enabled' }, { status: 404 });
    }

    // CSRF / same-site: verify Origin/Referer if this route is used by browsers
    const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
    if (allowed.length && !allowOrigin(req, allowed)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    // Optional X-Requested-With hardening (not a substitute for Origin)
    const xrw = req.headers.get('X-Requested-With') || req.headers.get('x-requested-with');
    if (xrw && xrw !== 'XMLHttpRequest') {
      return NextResponse.json({ error: 'Invalid request headers' }, { status: 400 });
    }

    // Parse & validate body
    const json = await req.json();
    const parsed = BodySchema.parse(json);

    // Rate limit per sender
    const rl = checkRate(`recognition:${parsed.senderId}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rl.resetAt),
            'Retry-After': String(Math.max(1, Math.ceil((rl.resetAt - now()) / 1000)))
          }
        }
      );
    }

    // Idempotency
    const idemKey = getIdemKey(req, parsed);
    if (idemKey) {
      const prev = idemCache.get(idemKey);
      if (prev) {
        return NextResponse.json(prev.response, {
          headers: { 'X-RateLimit-Remaining': String(rl.remaining), 'Idempotency-Replayed': '1' }
        });
      }
    }

    // Build recognition envelope
    let recognition: TMRecognitionV1;
    try {
      recognition = createRecognitionEnvelope({
        spaceId: parsed.spaceId,
        senderId: parsed.senderId,
        recipientId: parsed.recipientId,
        lens: parsed.lens,
        metadata: parsed.metadata,
        hcsTopicId: parsed.hcsTopicId // may be overridden below by registry topic
      });
      validateRecognition(recognition);
    } catch (e: any) {
      return NextResponse.json(
        { error: 'Invalid recognition data', details: e?.message || 'Schema validation failed' },
        { status: 400 }
      );
    }

    // HCS submit
    const topicId = await resolveTopic(parsed.hcsTopicId);
    if (!topicId) {
      return NextResponse.json({ error: 'No recognition topic configured' }, { status: 500 });
    }

    const hcsEnvelope = {
      type: 'RECOGNITION_V2',
      from: parsed.senderId,
      nonce: crypto.randomUUID(), // stronger than Date.now()
      ts: Math.floor(now() / 1000),
      payload: recognition
    };

    const hcsResult = await submitToTopic(topicId, JSON.stringify(hcsEnvelope));

    // Attach HCS proof to recognition (if your schema has these fields)
    (recognition as any).hcsSequenceNumber = hcsResult.sequenceNumber;
    (recognition as any).hcsConsensusTimestamp = hcsResult.consensusTimestamp;

    const resBody = {
      ok: true,
      recognition: {
        recognitionId: (recognition as any).recognitionId,
        correlationId: (recognition as any).correlationId,
        proofHash: (recognition as any).proofHash,
        hcsSequenceNumber: (recognition as any).hcsSequenceNumber,
        hcsConsensusTimestamp: (recognition as any).hcsConsensusTimestamp
      },
      lens: parsed.lens,
      spaceId: parsed.spaceId
    };

    // Cache idempotent response
    if (idemKey) idemCache.set(idemKey, { ts: now(), response: resBody });
    gcMaps();

    return NextResponse.json(resBody, {
      headers: {
        'X-RateLimit-Remaining': String(rl.remaining),
        ...(idemKey ? { 'Idempotency-Key': idemKey } : {})
      }
    });

  } catch (error: any) {
    // zod errors bubble as exceptions if parse() wasn't caught above
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid recognition format', details: error.flatten?.() ?? String(error) },
        { status: 400 }
      );
    }
    console.error('[Recognition v2 API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Method guards with Allow header */
const ALLOW = { headers: { Allow: 'POST' } };

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW });
}
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW });
}
export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW });
}