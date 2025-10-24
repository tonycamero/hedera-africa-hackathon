import { NextRequest, NextResponse } from 'next/server';
import { processWebhookEvent } from '@/lib/v2/engine/compliance';

// Ensure Node runtime (HMAC uses Node crypto)
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1) Read raw body BEFORE any JSON parsing
    const rawPayload = await req.text();

    // 2) Accept common signature header variants
    const signatureHeader =
      req.headers.get('x-matterfi-signature') ||
      req.headers.get('x-signature') ||
      req.headers.get('matterfi-signature') ||
      '';

    if (!signatureHeader) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }

    // 3) Flatten headers for audit trail
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => { headers[key] = value; });
    headers['x-signature-raw'] = signatureHeader;

    // 4) Process (includes HMAC verify, idempotency, transform, store)
    const ev = await processWebhookEvent(rawPayload, signatureHeader, headers);

    // If the engine returned a replay ack, bubble a header
    const replay = ev.metadata?.replay ? '1' : '0';

    console.log(`[MatterFi Webhook] Processed: ${ev.eventType} - ${ev.eventId} (replay: ${replay})`);

    // 5) Acknowledge quickly
    return NextResponse.json(
      { received: true, eventId: ev.eventId, eventType: ev.eventType, timestamp: ev.timestamp },
      { status: 200, headers: { 'X-Webhook-Replay': replay } }
    );

  } catch (error: any) {
    // Typed engine errors
    if (error?.name === 'ComplianceEngineError') {
      if (error.code === 'SIGNATURE_INVALID') {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
      if (error.code === 'WEBHOOK_VALIDATION_FAILED') {
        // Keep details terse to avoid leaking PII in logs
        return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
      }
    }

    console.error('[MatterFi Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Method guards with explicit Allow
const ALLOW = { headers: { Allow: 'POST' } };

export async function GET()   { return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW }); }
export async function PUT()   { return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW }); }
export async function DELETE(){ return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW }); }