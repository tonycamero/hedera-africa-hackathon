import { NextResponse } from 'next/server'
import { hederaClient } from '@/packages/hedera/HederaClient'
import { topics } from '@/lib/registry/serverRegistry'

export async function GET() {
  try {
    const topicRegistry = topics()
    const hcsEnabled = process.env.NEXT_PUBLIC_HCS_ENABLED === 'true'
    const mirrorRestUrl = process.env.HEDERA_MIRROR_REST_URL || 'https://testnet.mirrornode.hedera.com/api/v1'
    
    // Test Mirror Node
    let mirrorHealthy = false
    let mirrorDetails: any = {}
    
    try {
      const testUrl = `${mirrorRestUrl}/accounts?limit=1`
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
        url: mirrorRestUrl,
        error: error.message,
        healthy: false
      }
    }
    
    const health = {
      registry: {
        source: 'environment',
        loaded: true
      },
      hcs: {
        enabled: hcsEnabled,
        client: hederaClient.isReady(),
        topics: {
          contacts: topicRegistry.contacts,
          trust: topicRegistry.trust,
          recognition: topicRegistry.recognition,
          profile: topicRegistry.profile,
          signal: topicRegistry.signal,
          system: topicRegistry.system
        }
      },
      mirror: {
        rest: mirrorRestUrl,
        healthy: mirrorHealthy,
        details: mirrorDetails
      }
    }

    const readOnlyOK = mirrorHealthy && hcsEnabled
    const isHealthy = readOnlyOK

    console.log(`[Health Check] Registry-based health: ${isHealthy ? 'healthy' : 'degraded'}`, {
      topicsConfigured: Object.keys(topicRegistry).length,
      mirrorHealthy
    })

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: 'registry-v2.0',
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
      version: 'registry-v2.0'
    }, { status: 500 })
  }
}
