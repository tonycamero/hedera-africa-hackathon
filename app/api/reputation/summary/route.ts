import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getReputationPort } from '@/lib/v2/store/reputationLedger';

// Query schema (personaId required; optional spaceId/lens narrowing for future)
const QuerySchema = z.object({
  personaId: z.string().min(1, 'personaId is required'),
  spaceId: z.string().optional(),
  lens: z.enum(['genz', 'professional', 'social', 'builder']).optional(),
});

function json(body: any, init?: number | ResponseInit) {
  const res = NextResponse.json(body, init as any);
  res.headers.set('Content-Type', 'application/json; charset=utf-8');
  return res;
}

export async function GET(req: NextRequest) {
  try {
    // Parse & validate query
    const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return json(
        { success: false, error: { code: 'BAD_REQUEST', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }
    const { personaId, spaceId, lens } = parsed.data;

    // Fetch summary
    const reputationPort = getReputationPort();
    const summary = await reputationPort.getPersonaSummary(personaId);

    if (!summary) {
      return json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Persona not found' } },
        { status: 404 }
      );
    }

    // Optional narrowing (doesn't change totals; just provides convenience echo)
    const narrowed = {
      scoresBySpace: spaceId ? { [spaceId]: summary.scoresBySpace[spaceId] ?? 0 } : summary.scoresBySpace,
      scoresByLens: lens ? { [lens]: summary.scoresByLens[lens] } : summary.scoresByLens,
    };

    // Build payload
    const payload = {
      success: true,
      summary: {
        personaId: summary.personaId,
        hederaAccountId: summary.hederaAccountId,
        totalScore: summary.totalScore,
        scoresBySpace: narrowed.scoresBySpace,
        scoresByLens: narrowed.scoresByLens,
        lastUpdated: summary.lastUpdated,
        entryCount: summary.entryCount,
      },
    };

    // ETag to help FE cache when polling; vary by personaId + lastUpdated + totalScore
    const etagInput = `${summary.personaId}:${summary.lastUpdated}:${summary.totalScore}`;
    const etag = `"rep-${crypto.createHash('sha1').update(etagInput).digest('hex')}"`;
    const ifNoneMatch = req.headers.get('if-none-match');

    if (ifNoneMatch && ifNoneMatch === etag) {
      // Not modified
      const res = new NextResponse(null, { status: 304 });
      res.headers.set('ETag', etag);
      res.headers.set('Cache-Control', 'private, max-age=15, must-revalidate');
      return res;
    }

    const res = json(payload, { status: 200 });
    res.headers.set('ETag', etag);
    res.headers.set('Cache-Control', 'private, max-age=15, must-revalidate'); // short-lived, good for demo polling
    return res;
  } catch (err) {
    console.error('Reputation summary API error:', err);
    return json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to retrieve reputation summary' } },
      { status: 500 }
    );
  }
}
