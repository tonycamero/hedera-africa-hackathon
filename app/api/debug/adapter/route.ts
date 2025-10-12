import { NextResponse } from 'next/server';
import { listSince } from '@/lib/mirror/serverMirror';
import { toLegacyEventArray } from '@/lib/services/HCSDataAdapter';
import { getBondedContactsFromHCS, getTrustStatsFromHCS } from '@/lib/services/HCSDataUtils';

export async function GET() {
  try {
    // Get trust and contact events using the same API that the UI uses
    const trustResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/hcs/events?type=trust&limit=50`);
    const contactResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/hcs/events?type=contact&limit=50`);
    
    const trustResult = await trustResponse.json();
    const contactResult = await contactResponse.json();
    
    if (!trustResult.ok || !contactResult.ok) {
      throw new Error('Failed to fetch HCS events');
    }
    
    // Convert to legacy format
    console.log('🔍 HCS API events sample:', trustResult.items.slice(0, 2).map((m: any) => ({
      has_json: !!m.json,
      json_type: m.json?.type,
      consensus_timestamp: m.consensus_timestamp
    })));
    
    const allEvents = toLegacyEventArray([
      ...trustResult.items,
      ...contactResult.items,
    ] as any);
    
    console.log('🔍 Converted events sample:', allEvents.slice(0, 2));
    
    // Test the utils with Alex Chen
    const sessionId = 'tm-alex-chen';
    const bondedContacts = getBondedContactsFromHCS(allEvents, sessionId);
    const trustStats = getTrustStatsFromHCS(allEvents as any, sessionId);
    
    return NextResponse.json({
      ok: true,
      sessionId,
      rawEventCount: trustResult.items.length + contactResult.items.length,
      convertedEventCount: allEvents.length,
      rawSample: trustResult.items.slice(0, 2).map((m: any) => ({
        has_json: !!m.json,
        json_keys: m.json ? Object.keys(m.json) : [],
        consensus_timestamp: m.consensus_timestamp
      })),
      sampleEvents: allEvents.slice(0, 3).map(e => ({
        type: e.type,
        actor: e.actor,
        target: e.target,
        ts: e.ts
      })),
      bondedContacts: bondedContacts.map(c => ({
        peerId: c.peerId,
        handle: c.handle
      })),
      trustStats,
      alexChenEvents: allEvents.filter(e => 
        e.actor === sessionId || e.target === sessionId
      ).slice(0, 5).map(e => ({
        type: e.type,
        actor: e.actor,
        target: e.target
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}