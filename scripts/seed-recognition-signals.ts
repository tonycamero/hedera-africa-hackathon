/**
 * Seed Recognition Signals - Generate demo recognition signals between contacts
 * 
 * Creates realistic recognition signal activity between the 16 demo contacts
 * to populate the signals feed with fresh v2 data.
 */

const DEMO_CONTACTS = [
  'tm-alex-chen',
  'tm-maya-patel',
  'tm-jordan-kim',
  'tm-sam-rivera',
  'tm-sarah-dev',
  'tm-mike-design',
  'tm-lisa-crypto',
  'tm-james-startup',
  'tm-emily-writer',
  'tm-amara-okafor',
  'tm-kofi-asante',
  'tm-zara-mwangi',
  'tm-fatima-alrashid',
  'tm-kwame-nkomo',
  'tm-aisha-diallo',
  'tm-boma-nwachukwu'
]

// Rich recognition token templates from RECOGNITION_TOKENS_DATASET.md
const RECOGNITION_TOKENS = [
  // Social tokens with rich metadata
  { id: 'rizz', name: 'Rizz', description: 'smooth operator', icon: '🧠', category: 'social', trustValue: 0.3, rarity: 'Rare', labels: ['rizz', 'social-dynamics', 'charisma', 'social-skills'] },
  { id: 'goat', name: 'GOAT', description: 'greatest of all time', icon: '😊', category: 'social', trustValue: 0.5, rarity: 'Legendary', labels: ['goat', 'social-dynamics', 'legendary', 'excellence'] },
  { id: 'aura', name: 'Aura', description: 'positive energy', icon: '😊', category: 'social', trustValue: 0.25, rarity: 'Common', labels: ['aura', 'social-dynamics', 'positive-energy'] },
  { id: 'lowkey', name: 'Lowkey', description: 'subtle quiet flex', icon: '🚀', category: 'social', trustValue: 0.2, rarity: 'Common', labels: ['lowkey', 'social-dynamics', 'quiet'] },
  { id: 'ghost', name: 'Ghost', description: 'disappears often', icon: '👻', category: 'social', trustValue: 0.15, rarity: 'Common', labels: ['ghost', 'social-dynamics'] },
  { id: 'npc', name: 'NPC', description: 'background character energy', icon: '🤓', category: 'social', trustValue: 0.1, rarity: 'Common', labels: ['npc', 'social-dynamics'] },
  
  // Academic tokens with descriptions
  { id: 'prof-fav', name: 'Prof Fav', description: "teacher's pet, always cared on", icon: '🏆', category: 'academic', trustValue: 0.35, rarity: 'Common', labels: ['prof-fav', 'academic-achievement', 'teacher-relations'] },
  { id: 'note-taker', name: 'Note Taker', description: 'clean notes, everyone copies', icon: '✏️', category: 'academic', trustValue: 0.3, rarity: 'Common', labels: ['note-taker', 'academic-achievement', 'organization'] },
  { id: 'exam-sniper', name: 'Exam Sniper', description: 'crushes tests, silent otherwise', icon: '🎯', category: 'academic', trustValue: 0.4, rarity: 'Common', labels: ['exam-sniper', 'academic-achievement', 'test-performance'] },
  
  // Professional tokens with workplace context
  { id: 'problem-solver', name: 'Problem Solver', description: 'finds hacks for tricky work', icon: '❌', category: 'professional', trustValue: 0.45, rarity: 'Common', labels: ['problem-solver', 'workplace-skills', 'problem-solving'] },
  { id: 'network-ninja', name: 'Network Ninja', description: 'knows everyone everywhere', icon: '🕸️', category: 'professional', trustValue: 0.4, rarity: 'Common', labels: ['network-ninja', 'workplace-skills', 'networking'] },
  { id: 'code-monkey', name: 'Code Monkey', description: 'nonstop coder', icon: '👨‍💻', category: 'professional', trustValue: 0.35, rarity: 'Common', labels: ['code-monkey', 'workplace-skills', 'technical'] },
  { id: 'innovation-engine', name: 'Innovation Engine', description: 'always has new ideas', icon: '💡', category: 'professional', trustValue: 0.5, rarity: 'Common', labels: ['innovation-engine', 'social-dynamics'] }
]

const MESSAGES = [
  "Absolute legend! 🔥",
  "You're crushing it!",
  "So impressed by your work",
  "This is fire! Keep going",
  "Major respect ✊",
  "You're an inspiration",
  "Incredible energy!",
  "Love your vibe",
  "Pure excellence",
  "You're the GOAT 🐐"
]

async function submitRecognition(from: string, to: string, tokenTemplate: typeof RECOGNITION_TOKENS[0], message: string) {
  const envelope = {
    type: 'RECOGNITION_MINT',
    from: from,
    nonce: Date.now() + Math.random(),
    ts: Math.floor(Date.now() / 1000),
    payload: {
      definitionId: tokenTemplate.id,
      name: tokenTemplate.name,
      recognition: tokenTemplate.name,
      to: to,
      recipientId: to,
      recipientName: to.replace('tm-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      senderName: from.replace('tm-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      message: message,
      description: tokenTemplate.description,
      category: tokenTemplate.category,
      icon: tokenTemplate.icon,
      trustValue: tokenTemplate.trustValue,
      rarity: tokenTemplate.rarity,
      labels: tokenTemplate.labels,
      mintedBy: 'demo-network',
      timestamp: new Date().toISOString()
    }
  }

  try {
    const response = await fetch('http://localhost:3000/api/hcs/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    })

    const result = await response.json()
    
    if (result.ok) {
      console.log(`✅ ${from} → ${to}: ${tokenTemplate.icon} ${tokenTemplate.name}`)
      return true
    } else {
      console.error(`❌ Failed: ${result.error}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 Seeding recognition signals between demo contacts...\n')
  
  const signalsToCreate = 20 // Create 20 random recognition signals
  let successCount = 0
  
  for (let i = 0; i < signalsToCreate; i++) {
    // Pick random sender and recipient (different contacts)
    const sender = DEMO_CONTACTS[Math.floor(Math.random() * DEMO_CONTACTS.length)]
    let recipient = DEMO_CONTACTS[Math.floor(Math.random() * DEMO_CONTACTS.length)]
    
    // Ensure sender and recipient are different
    while (recipient === sender) {
      recipient = DEMO_CONTACTS[Math.floor(Math.random() * DEMO_CONTACTS.length)]
    }
    
    // Pick random token and message
    const token = RECOGNITION_TOKENS[Math.floor(Math.random() * RECOGNITION_TOKENS.length)]
    const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
    
    // Submit to Hedera
    const success = await submitRecognition(sender, recipient, token, message)
    if (success) successCount++
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log(`\n✨ Complete! Successfully created ${successCount}/${signalsToCreate} recognition signals`)
  console.log('🔥 Check the /signals page to see the new activity!')
}

main().catch(console.error)
