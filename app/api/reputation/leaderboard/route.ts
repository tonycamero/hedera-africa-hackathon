import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getReputationPort } from '@/lib/v2/store/reputationLedger';
import { getPersonaById } from '@/lib/v2/demo/personas';

// Validate & coerce query
const QuerySchema = z.object({
  spaceId: z.string().min(1).optional(),
  lens: z.enum(['genz', 'professional', 'social', 'builder']).optional(),
  limit: z
    .string()
    .transform((v) => Number(v))
    .refine((n) => Number.isFinite(n) && n > 0, { message: 'limit must be a positive number' })
    .transform((n) => Math.min(n, 50))
    .optional(),
});

function json(body: any, init?: number | ResponseInit) {
  const res = NextResponse.json(body, init as any);
  res.headers.set('Content-Type', 'application/json; charset=utf-8');
  return res;
}

/**
 * GET /api/reputation/leaderboard?spaceId=...&lens=...&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const paramsObj = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = QuerySchema.safeParse(paramsObj);

    if (!parsed.success) {
      return json(
        { success: false, error: { code: 'BAD_REQUEST', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { spaceId, lens, limit } = parsed.data;
    const reputationPort = getReputationPort();

    const leaderboard = await reputationPort.getLeaderboard({
      spaceId,
      lens,
      limit: limit ?? 10,
    });

    // Enrich with persona details (best-effort; null if not found)
    const enriched = leaderboard.map((entry) => {
      const persona = getPersonaById(entry.personaId);
      return {
        ...entry,
        persona: persona
          ? {
              name: persona.name,
              role: persona.role,
              primaryLens: persona.primaryLens,
              context: persona.context,
              bio: persona.bio,
            }
          : null,
      };
    });

    const payload = {
      success: true,
      leaderboard: enriched,
      filters: { spaceId: spaceId ?? null, lens: lens ?? null, limit: limit ?? 10 },
      timestamp: new Date().toISOString(),
    };

    // ETag based on inputs + top entries snapshot
    const etagInput = JSON.stringify({
      spaceId: spaceId ?? '',
      lens: lens ?? '',
      limit: limit ?? 10,
      top: leaderboard.map((x) => `${x.personaId}:${x.score}`), // compact
    });
    const etag = `"lbrd-${crypto.createHash('sha1').update(etagInput).digest('hex')}"`;
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch && ifNoneMatch === etag) {
      const res = new NextResponse(null, { status: 304 });
      res.headers.set('ETag', etag);
      res.headers.set('Cache-Control', 'private, max-age=15, must-revalidate');
      return res;
    }

    const res = json(payload, { status: 200 });
    res.headers.set('ETag', etag);
    res.headers.set('Cache-Control', 'private, max-age=15, must-revalidate');
    return res;
  } catch (err) {
    console.error('Reputation leaderboard API error:', err);
    return json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to retrieve leaderboard' } },
      { status: 500 }
    );
  }
}