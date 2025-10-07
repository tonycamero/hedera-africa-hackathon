/**
 * Script to populate tm-alex-chen with diverse recognition tokens
 * This will demonstrate the character development aspect of the recognition system
 */

import { recognitionSignals } from '@/lib/data/recognitionSignals'

// Alex Chen's character profile - a well-rounded tech professional with African connections
const ALEX_PROFILE = {
  sessionId: 'tm-alex-chen',
  name: 'Alex Chen',
  story: 'A Nigerian-American tech entrepreneur building bridges between Silicon Valley and Lagos',
  recognitions: [
    // Social Recognitions (Character: Charismatic community connector)
    {
      id: 'chad',
      earnedAt: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      evidence: 'Led the African Tech Summit networking session, connected 50+ entrepreneurs',
      issuer: 'tm-community-lead',
      context: 'African Tech Summit 2024'
    },
    {
      id: 'rizz', 
      earnedAt: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
      evidence: 'Smooth-talked three major VCs into attending Lagos Startup Week',
      issuer: 'tm-lagos-organizer',
      context: 'Lagos Startup Week Organization'
    },
    {
      id: 'ubuntu-spirit',
      earnedAt: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
      evidence: 'Mentored 20+ young entrepreneurs using Ubuntu principles of collective success',
      issuer: 'tm-mentor-council',
      context: 'Pan-African Entrepreneurship Program'
    },
    {
      id: 'griot-keeper',
      earnedAt: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago
      evidence: 'Documented and shared stories of 100+ African tech pioneers',
      issuer: 'tm-cultural-council',
      context: 'Digital Heritage Project'
    },
    
    // Professional Recognitions (Character: Serial entrepreneur and innovator)
    {
      id: 'kigali-innovator',
      earnedAt: Date.now() - (120 * 24 * 60 * 60 * 1000), // 120 days ago
      evidence: 'Built mobile payment solution connecting 10 African countries',
      issuer: 'tm-tech-council',
      context: 'Pan-African Fintech Initiative'
    },
    {
      id: 'cooperative-leader',
      earnedAt: Date.now() - (150 * 24 * 60 * 60 * 1000), // 150 days ago
      evidence: 'Organized cooperative of 500+ African developers sharing equity and knowledge',
      issuer: 'tm-professional-board',
      context: 'African Developer Cooperative'
    },
    {
      id: 'balogun-trader',
      earnedAt: Date.now() - (180 * 24 * 60 * 60 * 1000), // 180 days ago
      evidence: 'Negotiated $50M investment deal for African startups using traditional market wisdom',
      issuer: 'tm-investment-guild',
      context: 'African Venture Capital Summit'
    },
    {
      id: 'powerpoint-pro',
      earnedAt: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 days ago
      evidence: 'Delivered keynote with stunning visuals at TechCrunch Disrupt',
      issuer: 'tm-conference-reviewer',
      context: 'TechCrunch Disrupt 2024'
    },
    
    // Academic Recognitions (Character: Lifelong learner bridging cultures)
    {
      id: 'makerere-scholar',
      earnedAt: Date.now() - (200 * 24 * 60 * 60 * 1000), // 200 days ago
      evidence: 'Published research on African tech ecosystems, cited 500+ times',
      issuer: 'tm-academic-council',
      context: 'Journal of African Innovation'
    },
    {
      id: 'timbuktu-librarian',
      earnedAt: Date.now() - (250 * 24 * 60 * 60 * 1000), // 250 days ago
      evidence: 'Digitized 1000+ historical African business documents for future generations',
      issuer: 'tm-heritage-keeper',
      context: 'African Business History Archive'
    },
    {
      id: 'prof-fav',
      earnedAt: Date.now() - (300 * 24 * 60 * 60 * 1000), // 300 days ago
      evidence: 'Guest lecturer at 15 universities across Africa, beloved by students',
      issuer: 'tm-education-network',
      context: 'African University Circuit'
    },
    
    // Gen Z Recognitions (Character: Bridge between generations and cultures)
    {
      id: 'aura',
      earnedAt: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
      evidence: 'Radiates such positive energy that deal rooms calm down when they enter',
      issuer: 'tm-peer-network',
      context: 'Investor Relations'
    },
    {
      id: 'lowkey',
      earnedAt: Date.now() - (20 * 24 * 60 * 60 * 1000), // 20 days ago
      evidence: 'Quietly funded 50 African startups without seeking recognition',
      issuer: 'tm-startup-community',
      context: 'Silent Angel Investment'
    }
  ]
}

async function mintRecognition(recognition: any) {
  try {
    const response = await fetch('/api/hcs/mint-recognition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: ALEX_PROFILE.sessionId,
        recognitionId: recognition.id,
        evidence: recognition.evidence,
        issuer: recognition.issuer,
        context: recognition.context,
        earnedAt: recognition.earnedAt
      })
    })
    
    if (response.ok) {
      console.log(`✅ Minted ${recognition.id} for ${ALEX_PROFILE.name}`)
    } else {
      console.error(`❌ Failed to mint ${recognition.id}:`, await response.text())
    }
  } catch (error) {
    console.error(`❌ Error minting ${recognition.id}:`, error)
  }
}

async function populateAlexRecognitions() {
  console.log(`🚀 Populating recognition tokens for ${ALEX_PROFILE.name}...`)
  console.log(`📖 Character: ${ALEX_PROFILE.story}`)
  console.log(`🎯 Target: ${ALEX_PROFILE.recognitions.length} recognition tokens`)
  
  // Mint recognitions in chronological order (oldest first)
  const sortedRecognitions = ALEX_PROFILE.recognitions.sort((a, b) => a.earnedAt - b.earnedAt)
  
  for (const recognition of sortedRecognitions) {
    const tokenDef = recognitionSignals.find(s => s.id === recognition.id)
    if (tokenDef) {
      console.log(`\n🎖️ Minting: ${tokenDef.name} (${tokenDef.rarity})`)
      console.log(`   📝 Evidence: ${recognition.evidence}`)
      await mintRecognition(recognition)
      // Small delay to avoid overwhelming HCS
      await new Promise(resolve => setTimeout(resolve, 1000))
    } else {
      console.warn(`⚠️ Token definition not found for: ${recognition.id}`)
    }
  }
  
  console.log(`\n🎉 Completed populating ${ALEX_PROFILE.name}'s profile!`)
  console.log(`🌟 Character demonstrates:`)
  console.log(`   • African cultural wisdom (Ubuntu Spirit, Griot Keeper, Timbuktu Librarian)`)
  console.log(`   • Professional excellence (Kigali Innovator, Cooperative Leader, Balogun Trader)`)
  console.log(`   • Community leadership (Chad, Ubuntu Spirit, Makerere Scholar)`) 
  console.log(`   • Cross-generational bridge (Gen Z tokens + traditional wisdom)`)
}

// Run the population script
if (typeof window === 'undefined') {
  // Node.js environment
  populateAlexRecognitions().catch(console.error)
} else {
  // Browser environment - expose function globally
  ;(window as any).populateAlexRecognitions = populateAlexRecognitions
  console.log('🔧 Run populateAlexRecognitions() to populate Alex Chen\'s profile')
}

export { populateAlexRecognitions, ALEX_PROFILE }