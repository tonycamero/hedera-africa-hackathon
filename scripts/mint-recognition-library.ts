/**
 * Convert old recognition definitions to new SIGNAL_MINT format and mint to HCS
 * Enriches definitions with subtitle, metadata, and full self-contained structure
 */

import { Client, TopicMessageSubmitTransaction, PrivateKey } from '@hashgraph/sdk'
import * as fs from 'fs'
import * as path from 'path'

// Load old definitions
const oldDefinitions = JSON.parse(
  fs.readFileSync('/tmp/old_definitions.json', 'utf-8')
) as Array<{
  id: string
  name: string
  icon: string
  category: string
  description: string
}>

// Test users to mint signals to
const testUsers = [
  'tm-alex-chen',
  'tm-sam-rivera',
  'tm-jordan-kim',
  'tm-maya-patel',
  'tm-riley-santos',
  'tm-casey-wright',
]

// Enrich definitions with subtitles and metadata
function enrichDefinition(def: typeof oldDefinitions[0]) {
  const subtitles: Record<string, string> = {
    // Social
    'delulu': 'delicious confidence',
    'aura': 'positive energy radiating',
    'brain-rot': 'too much screen time',
    'networking-goat': 'connection master',
    'rizz': 'natural charisma',
    'no-cap': 'keeping it real',
    'vibe-check': 'reading the room',
    'main-character': 'center of attention',
    'slay': 'absolute excellence',
    'bussin': 'incredibly good',
    'fire': 'exceptionally hot',
    'bet': 'agreement achieved',
    'toxic': 'negative energy',
    
    // Professional
    'code-monkey': 'terminal warrior',
    'budget-boss': 'financial wizard',
    'coffee-iv': 'caffeine dependent',
    'meeting-martyr': 'calendar overload',
    'email-ninja': 'inbox zero champion',
    'deadline-dancer': 'last-minute legend',
    'powerpoint-picasso': 'slide deck artist',
    'data-whisperer': 'analytics guru',
    'spreadsheet-samurai': 'excel master',
    'jargon-juggler': 'buzzword specialist',
    'synergy-seeker': 'collaboration champion',
    'pivot-pro': 'change management expert',
    'stakeholder-sherpa': 'relationship navigator',
    'kpi-crusher': 'metrics dominator',
    'roi-rockstar': 'value maximizer',
    'agile-acrobat': 'sprint champion',
    'scrum-sensei': 'methodology master',
    'kanban-king': 'workflow optimizer',
    'retrospective-royal': 'continuous improver',
    'standup-star': 'daily update champion',
    
    // Academic
    'bookworm': 'literature lover',
    'deadline-dancer': 'procrastination master',
    'background-dj': 'study soundtrack curator',
    'coffee-scholar': 'caffeinated learner',
    'library-legend': 'research champion',
    'note-ninja': 'meticulous recorder',
    'citation-champion': 'reference master',
    'thesis-titan': 'dissertation warrior',
    'lab-legend': 'experiment expert',
    'equation-expert': 'math wizard',
    'history-buff': 'past enthusiast',
    'science-star': 'discovery seeker',
    'language-lord': 'polyglot master',
    'philosophy-phenom': 'deep thinker',
    'art-aficionado': 'creative connoisseur',
    'music-maestro': 'sonic scholar',
    'sports-scholar': 'athletic academic',
    'debate-dynamo': 'argument artist',
    'quiz-queen': 'trivia champion',
    'study-group-savior': 'collaborative learner',
  }

  return {
    tokenId: `${def.id}_${Date.now()}`,
    name: def.name,
    kind: def.category, // lens category
    subtitle: subtitles[def.id] || def.description || 'recognized achievement',
    emoji: def.icon,
    description: def.description,
    metadata: {
      category: def.category,
      definitionId: def.id,
      version: '3.0', // New self-contained format
      minted_at: new Date().toISOString(),
    }
  }
}

// Create SIGNAL_MINT message
function createSignalMintMessage(
  enrichedDef: ReturnType<typeof enrichDefinition>,
  to: string,
  from: string
) {
  return {
    type: 'SIGNAL_MINT',
    from,
    nonce: Date.now() + Math.random(),
    ts: Math.floor(Date.now() / 1000),
    payload: {
      ...enrichedDef,
      to,
      uri: `hcs://11/${process.env.NEXT_PUBLIC_TOPIC_SIGNAL}/${Date.now()}`,
    },
    sig: 'demo_signature',
  }
}

async function mintSignalsToHCS() {
  // Use existing API infrastructure instead of direct Hedera SDK
  const API_URL = process.env.API_URL || 'http://localhost:3000'

  console.log(`🚀 Minting ${oldDefinitions.length} recognition signals via API`)
  console.log(`📊 Distribution: ${oldDefinitions.filter(d => d.category === 'social').length} social, ${oldDefinitions.filter(d => d.category === 'professional').length} professional, ${oldDefinitions.filter(d => d.category === 'academic').length} academic`)

  let minted = 0
  let failed = 0

  // Mint each recognition type as a signal to a random test user
  for (const def of oldDefinitions) {
    try {
      const enriched = enrichDefinition(def)
      const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)]
      const message = createSignalMintMessage(
        enriched,
        randomUser,
        `issuer.${def.category}`
      )

      // Submit via API endpoint (uses server-side credentials)
      const response = await fetch(`${API_URL}/api/hcs/mint-recognition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: enriched.tokenId,
          name: enriched.name,
          category: enriched.kind,
          subtitle: enriched.subtitle,
          emoji: enriched.emoji,
          issuerId: `issuer.${def.category}`,
          recipientId: randomUser,
        }),
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`)
      }

      const result = await response.json()
      if (!result.ok) {
        throw new Error(result.error || 'Unknown error')
      }

      minted++
      console.log(`✅ Minted: ${def.name} (${def.category}) → ${randomUser}`)
      
      // Rate limit to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      failed++
      console.error(`❌ Failed to mint ${def.name}:`, error)
    }
  }

  console.log(`\n🎉 Complete! Minted ${minted} signals, ${failed} failed`)
}

// Run if executed directly
if (require.main === module) {
  mintSignalsToHCS().catch(console.error)
}

export { mintSignalsToHCS, enrichDefinition, createSignalMintMessage }
