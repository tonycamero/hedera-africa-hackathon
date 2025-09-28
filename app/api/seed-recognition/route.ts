import { NextRequest, NextResponse } from 'next/server'
import { hederaClient } from '@/packages/hedera/HederaClient'
import { assertDemoAllowed } from '@/lib/demo/guard'

const ALEX_CHEN_SESSION = 'alex-chen-demo-session-2024'

const RECOGNITION_DEFINITIONS = [
  { id: 'chad', name: 'Chad', description: 'alpha vibes', category: 'social', icon: '🦆' },
  { id: 'delulu', name: 'Delulu', description: 'delicious confidence', category: 'social', icon: '🤡' },
  { id: 'rizz', name: 'Rizz', description: 'smooth operator', category: 'social', icon: '🧠' },
  { id: 'skibidi', name: 'Skibidi', description: 'chaotic energy', category: 'social', icon: '🤪' },
  { id: 'prof-fav', name: 'Prof Fav', description: "teacher's pet, always cared on", category: 'academic', icon: '🏆' },
  { id: 'code-monkey', name: 'Code Monkey', description: 'nonstop coder', category: 'professional', icon: '👨‍💻' },
  { id: 'powerpoint-pro', name: 'PowerPoint Pro', description: 'biggest slides in the room', category: 'professional', icon: '📊' }
]

export async function POST(request: NextRequest) {
  if (!assertDemoAllowed('POST /api/seed-recognition')) {
    return NextResponse.json({ ok: false, error: 'demo-disabled' }, { status: 403 });
  }
  
  console.log('🌱 Starting recognition seeding to HCS...')
  
  try {
    await hederaClient.initialize()
    
    const recognitionTopicId = process.env.NEXT_PUBLIC_HCS_RECOGNITION_TOPIC
    if (!recognitionTopicId) {
      throw new Error('Recognition topic not configured')
    }
    
    console.log(`📡 Using recognition topic: ${recognitionTopicId}`)
    
    const results = {
      definitionsCreated: 0,
      instancesMinted: 0,
      errors: [] as string[]
    }
    
    // 1. Seed Recognition Definitions
    console.log('📋 Creating recognition definitions...')
    for (const def of RECOGNITION_DEFINITIONS) {
      try {
        const definitionEvent = {
          id: `def_${def.id}_${Date.now()}`,
          type: 'recognition_definition_created',
          timestamp: new Date().toISOString(),
          actor: 'system',
          target: 'all',
          metadata: {
            definitionId: def.id,
            name: def.name,
            description: def.description,
            category: def.category,
            icon: def.icon,
            number: RECOGNITION_DEFINITIONS.indexOf(def) + 1,
            isActive: true,
            rarity: 'Common',
            explorerUrl: `https://hashscan.io/testnet/topic/${recognitionTopicId}`
          },
          status: 'onchain',
          direction: 'outbound',
          topicId: recognitionTopicId
        }
        
        await hederaClient.submitMessage(recognitionTopicId, JSON.stringify(definitionEvent))
        console.log(`  ✅ Created definition: ${def.name}`)
        results.definitionsCreated++
        
        // Small delay to avoid overwhelming HCS
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        const errorMsg = `Failed to create definition ${def.name}: ${error.message}`
        console.error(errorMsg)
        results.errors.push(errorMsg)
      }
    }
    
    // 2. Mint Recognition Instances for Alex Chen
    console.log('🏆 Minting recognition instances for Alex Chen...')
    const alexRecognitions = ['chad', 'delulu', 'prof-fav', 'code-monkey']
    
    for (const recognitionId of alexRecognitions) {
      try {
        const def = RECOGNITION_DEFINITIONS.find(d => d.id === recognitionId)
        if (!def) continue
        
        const instanceEvent = {
          id: `inst_${recognitionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'recognition_mint',
          timestamp: new Date().toISOString(),
          actor: 'demo-network',
          target: ALEX_CHEN_SESSION,
          metadata: {
            definitionId: recognitionId,
            name: def.name,
            description: def.description,
            category: def.category,
            icon: def.icon,
            tokenId: `TM-${recognitionId.toUpperCase()}-${Date.now()}`,
            serialNumber: Math.floor(Math.random() * 1000000),
            explorerUrl: `https://hashscan.io/testnet/topic/${recognitionTopicId}`
          },
          status: 'onchain',
          direction: 'inbound',
          topicId: recognitionTopicId
        }
        
        await hederaClient.submitMessage(recognitionTopicId, JSON.stringify(instanceEvent))
        console.log(`  🎯 Minted ${def.name} for Alex Chen`)
        results.instancesMinted++
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        const errorMsg = `Failed to mint ${recognitionId}: ${error.message}`
        console.error(errorMsg)
        results.errors.push(errorMsg)
      }
    }
    
    console.log('✅ Recognition seeding complete!')
    console.log(`📊 Created ${results.definitionsCreated} definitions`)
    console.log(`🏆 Minted ${results.instancesMinted} instances for Alex Chen`)
    
    return NextResponse.json({
      success: true,
      message: 'Recognition seeding completed',
      results
    })
    
  } catch (error) {
    console.error('❌ Recognition seeding failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  if (!assertDemoAllowed('GET /api/seed-recognition')) {
    return NextResponse.json({ ok: false, error: 'demo-disabled' }, { status: 403 });
  }
  
  return NextResponse.json({
    message: 'Use POST to seed recognition data to HCS',
    definitions: RECOGNITION_DEFINITIONS.length,
    alexTokens: ['chad', 'delulu', 'prof-fav', 'code-monkey']
  })
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
