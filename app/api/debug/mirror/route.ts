export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { clean } from '@/lib/env';

export async function GET(req: NextRequest) {
  try {
    const topic = new URL(req.url).searchParams.get('topic');
    if (!topic) {
      return new Response('missing topic parameter', { status: 400 });
    }

    // Clean and construct URL
    const cleanTopic = clean(topic);
    const mirrorBase = 'https://testnet.mirrornode.hedera.com/api/v1';
    const url = `${mirrorBase}/topics/${encodeURIComponent(cleanTopic)}/messages?limit=5&order=desc`;
    
    console.log(`[Mirror Proxy] Fetching: ${url}`);
    
    const response = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrustMesh/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`[Mirror Proxy] HTTP ${response.status} for ${url}`);
      return new Response(`Mirror API error: ${response.status}`, { status: response.status });
    }
    
    const data = await response.json();
    console.log(`[Mirror Proxy] Success: ${data?.messages?.length || 0} messages for topic ${cleanTopic}`);
    
    return Response.json({
      ok: true,
      topic: cleanTopic,
      url,
      messageCount: data?.messages?.length || 0,
      messages: data.messages || [],
      timestamp: new Date().toISOString()
    }, { 
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      } 
    });
    
  } catch (error) {
    console.error('[Mirror Proxy] Error:', error);
    return Response.json({ 
      ok: false, 
      error: error.message 
    }, { 
      status: 500,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}