import { NextResponse } from 'next/server'
import { hederaClient } from '@/packages/hedera/HederaClient'
import { getRegistry, getRegistrySource, getAllTopicIds, mirrorRestUrl } from '@/lib/registry/serverRegistry'

export async function GET() {
  try {
    const registry = getRegistry()
    const registrySource = getRegistrySource()
    const topics = getAllTopicIds()
    
    // Test Mirror Node directly using registry URLs
    let mirrorHealthy = false
    let mirrorDetails: any = {}
    
    try {
      const testUrl = `${registry.mirror.rest}/accounts?limit=1`
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      })
      mirrorHealthy = response.ok
      mirrorDetails = {
        url: testUrl,
        status: response.status,
        healthy: response.ok
      }
    } catch (error: any) {
      mirrorDetails = {
        url: registry.mirror.rest,
        error: error.message,
        healthy: false
      }
    }
    
    const health = {
      registry: {
        source: registrySource,
        env: registry.env,
        loaded: true,
        flags: registry.flags
      },
      hcs: {
        enabled: registry.flags.HCS_ENABLED,
        client: hederaClient.isReady(),
        topics: {
          contacts: topics.contacts || 'not configured',
          trust: topics.trust || 'not configured', 
          recognition: topics.recognition || 'not configured',
          profile: topics.profile || 'not configured'
        },
        sharedContactsTrust: registry.flags.SHARED_CONTACTS_TRUST_TOPIC
      },
      mirror: {
        rest: registry.mirror.rest,
        ws: registry.mirror.ws,
        healthy: mirrorHealthy,
        details: mirrorDetails
      }
    }

    const readOnlyOK = mirrorHealthy && registry.flags.HCS_ENABLED && Object.values(topics).every(topic => topic && topic !== 'not configured');
    const isHealthy = readOnlyOK;

    console.log(`[Health Check] Registry-based health: ${isHealthy ? 'healthy' : 'degraded'}`, {
      source: registrySource,
      env: registry.env,
      topicsConfigured: Object.keys(topics).length,
      mirrorHealthy: mirrorHealthy
    })

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: 'registry-v1.0',
      ...health
    }, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 's-maxage=10, stale-while-revalidate=30'
      }
    })
  } catch (error: any) {
    console.error('[Health Check] Registry-based health check failed:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Health check failed',
      timestamp: new Date().toISOString(),
      version: 'registry-v1.0'
    }, { status: 500 })
  }
}
