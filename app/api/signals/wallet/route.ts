import { NextResponse } from 'next/server'
import { SignalAsset } from '@/lib/types/signals-collectible'
import { demoMode } from '@/lib/config/demo-mode'
import { signalsStore } from '@/lib/stores/signalsStore'
import { recognitionSignals } from '@/lib/data/recognitionSignals'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const view = searchParams.get('view') || 'owned'

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner parameter required' }, 
        { status: 400 }
      )
    }

    // Check demo mode - if not using mock wallet data, fetch real HCS recognition data
    if (!demoMode.shouldUseMockWallet()) {
      // For Alex Chen (the default user), fetch his recognition data from HCS signals
      const sessionId = owner === '0.0.123456' ? 'tm-alex-chen' : owner
      
      // Get recognition events from signals store (RECOGNITION_MINT type for the user)
      const recognitionEvents = signalsStore.getByType('RECOGNITION_MINT')
        .filter(event => event.target === sessionId)
      
      // Transform HCS events to SignalAsset format
      const hcsAssets: SignalAsset[] = recognitionEvents.map((event) => {
        // Extract recognition details from metadata
        const recognitionId = event.metadata?.recognitionId || event.metadata?.recognition_id
        const evidence = event.metadata?.evidence || 'Recognition earned on HCS'
        const context = event.metadata?.context || 'TrustMesh Network'
        const issuer = event.metadata?.issuer || event.actor
        
        // Find matching recognition definition
        const recognitionDef = recognitionSignals.find(r => r.id === recognitionId)
        
        return {
          asset_id: event.id || `hcs_${event.ts}`,
          instance_id: `inst_${event.ts}`,
          type_id: `${recognitionId}@1`,
          issuer_pub: issuer,
          recipient_pub: sessionId,
          issued_at: new Date(event.ts).toISOString(),
          metadata: {
            category: recognitionDef?.name || recognitionId,
            rarity: recognitionDef?.rarity || 'Common',
            inscription: evidence,
            labels: [
              recognitionDef?.category || 'recognition',
              context.toLowerCase().replace(/\s+/g, ' '),
              'hcs verified',
              'live data'
            ],
            hcs_source: true,
            recognition_id: recognitionId,
            context: context,
            emoji: recognitionDef?.icon || '🏆'
          }
        }
      })
      
      // Sort by issued_at desc (newest first)
      const sortedAssets = hcsAssets.sort((a, b) => 
        new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
      )
      
      return NextResponse.json({
        assets: sortedAssets,
        count: sortedAssets.length,
        owner: sessionId,
        dataSource: 'HCS Live'
      })
    }

    // Mock signal assets for demo
    const mockSignalAssets: SignalAsset[] = [
      {
        asset_id: "nft_001",
        instance_id: "inst_001", 
        type_id: "rizz@1",
        issuer_pub: "0.0.12345",
        recipient_pub: owner,
        issued_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        metadata: {
          category: "Rizz",
          rarity: "Heat",
          inscription: "Absolutely smooth presentation in the team meeting 🔥",
          labels: ["smooth operator", "charm level: max", "charisma unlocked", "rizz god status", "magnetic energy"]
        }
      },
      {
        asset_id: "nft_002",
        instance_id: "inst_002",
        type_id: "clutch@1", 
        issuer_pub: "0.0.67890",
        recipient_pub: owner,
        issued_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        metadata: {
          category: "Clutch",
          rarity: "Peak",
          inscription: "Delivered the project under impossible deadline pressure",
          labels: ["came through", "under pressure", "when it mattered", "ice in veins", "delivered"]
        }
      },
      {
        asset_id: "nft_003",
        instance_id: "inst_003",
        type_id: "big-brain@1",
        issuer_pub: "0.0.54321", 
        recipient_pub: owner,
        issued_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        metadata: {
          category: "Big Brain",
          rarity: "Peak", 
          inscription: "Called the market crash 3 weeks before it happened",
          labels: ["galaxy brain", "4D chess", "saw it coming", "next level thinking", "intellectual beast"]
        }
      },
      {
        asset_id: "nft_004",
        instance_id: "inst_004",
        type_id: "grind@1",
        issuer_pub: "0.0.98765",
        recipient_pub: owner,
        issued_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        metadata: {
          category: "Grind",
          rarity: "Regular",
          inscription: "5am workouts for 30 days straight - dedication noticed!",
          labels: ["hustle mode", "relentless work", "grind never stops", "effort appreciation", "dedication recognized"]
        }
      },
      {
        asset_id: "nft_005",
        instance_id: "inst_005",
        type_id: "day-1@1",
        issuer_pub: "0.0.13579",
        recipient_pub: owner,
        issued_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago 
        metadata: {
          category: "Day 1",
          rarity: "God-Tier",
          inscription: "Been supporting this vision since the very beginning",
          labels: ["been here since day 1", "loyalty recognized", "original supporter", "ride or die", "foundation member"]
        }
      }
    ]

    // Sort by issued_at desc (newest first)
    const sortedAssets = mockSignalAssets.sort((a, b) => 
      new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    )

    return NextResponse.json({
      assets: sortedAssets,
      count: sortedAssets.length,
      owner,
      dataSource: 'Mock Data'
    })

  } catch (error) {
    console.error('Failed to load wallet signals:', error)
    return NextResponse.json(
      { error: 'Failed to load wallet signals' }, 
      { status: 500 }
    )
  }
}