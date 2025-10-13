#!/usr/bin/env node
/**
 * Seed Demo Boost Signals for Testing
 * This creates signals in the store with boost IDs so the boost pages work
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function createBoostId(sender, recipient, template, fill, timestamp) {
  const input = `${sender}:${recipient}:${template}:${fill}:${timestamp}`
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)
}

// Demo scenarios matching our boost links
const demoScenarios = [
  {
    title: "🔥 Business Presentation Win",
    sender: "tm-alex-chen",
    recipient: "tm-sarah-kim", 
    template: "That presentation was ___",
    fill: "absolutely killer! The investors were nodding the whole time 🔥",
    senderHandle: "alex.chen",
    recipientHandle: "sarah.kim",
    note: "Seriously, you had them eating out of your palm. That's how you close deals!"
  },
  {
    title: "⚡ Hackathon Coding Beast", 
    sender: "tm-maya-patel",
    recipient: "tm-alex-chen",
    template: "Your ___ game is unmatched",
    fill: "coding during the hackathon - shipped 3 features while we were still reading docs",
    senderHandle: "maya.creates",
    recipientHandle: "alex.chen",
    note: "Watched you debug that API integration in 10 minutes. Pure wizardry! 🧙‍♂️"
  },
  {
    title: "✨ Networking Main Character",
    sender: "tm-jordan-lee", 
    recipient: "tm-maya-patel",
    template: "That was ___ energy",
    fill: "pure main character - walked into that networking event like you owned the place",
    senderHandle: "jordan.social",
    recipientHandle: "maya.creates", 
    note: "Everyone wanted to talk to you. That's what confidence looks like!"
  },
  {
    title: "🎯 Clutch Problem Solver",
    sender: "tm-sam-rivera",
    recipient: "tm-jordan-lee", 
    template: "You absolutely ___",
    fill: "saved our demo with that last-minute fix. Crisis averted like a pro!",
    senderHandle: "sam.builds",
    recipientHandle: "jordan.social",
    note: "1 hour before demo, everything broke. You fixed it in 20 minutes. Legend."
  }
]

// Create signals with boost IDs
const demoSignals = demoScenarios.map((scenario, i) => {
  const timestamp = Date.now() - (i * 3600000) // Stagger by hours
  const boostId = createBoostId(
    scenario.sender, 
    scenario.recipient, 
    scenario.template, 
    scenario.fill, 
    timestamp
  )

  return {
    id: `demo-boost-${i + 1}`,
    type: 'GENZ_SIGNAL',
    actor: scenario.sender,
    target: scenario.recipient,
    ts: timestamp,
    metadata: {
      boostId: boostId,
      template: scenario.template,
      fill: scenario.fill,
      note: scenario.note,
      senderHandle: scenario.senderHandle,
      recipientHandle: scenario.recipientHandle,
      templateId: `genz-demo-${i + 1}`,
      category: 'GenZ Recognition',
      rarity: 'Epic',
      lens: 'genz'
    }
  }
})

console.log('🚀 Demo Boost Signals Created:')
console.log('================================')

demoSignals.forEach((signal, i) => {
  console.log(`${i + 1}. ${demoScenarios[i].title}`)
  console.log(`   Boost ID: ${signal.metadata.boostId}`)
  console.log(`   Local URL: http://localhost:3000/boost/${signal.metadata.boostId}`)
  console.log(`   Signal: "${signal.metadata.template.replace('___', signal.metadata.fill)}"`)
  console.log()
})

// Create a simple test API endpoint to add these signals to the store
const testApiContent = `import { NextResponse } from 'next/server'
import { signalsStore } from '@/lib/stores/signalsStore'

const demoSignals = ${JSON.stringify(demoSignals, null, 2)}

export async function POST() {
  try {
    // Add demo signals to the store
    demoSignals.forEach(signal => {
      signalsStore.addSignal(signal as any)
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Demo boost signals added to store',
      count: demoSignals.length,
      boostIds: demoSignals.map(s => s.metadata.boostId)
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  const allSignals = signalsStore.getAll()
  const boostSignals = allSignals.filter(s => s.metadata?.boostId)
  
  return NextResponse.json({
    totalSignals: allSignals.length,
    boostSignals: boostSignals.length,
    boostIds: boostSignals.map(s => s.metadata?.boostId)
  })
}
`

// Write the test API endpoint
const apiDir = path.join(__dirname, 'app', 'api', 'test-boosts')
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true })
}

fs.writeFileSync(path.join(apiDir, 'route.ts'), testApiContent)

console.log('✅ Created test API endpoint: /api/test-boosts')
console.log('   POST /api/test-boosts - Add demo signals to store')  
console.log('   GET /api/test-boosts - Check current signals')
console.log()
console.log('🧪 To activate the demo boost links:')
console.log('   curl -X POST http://localhost:3000/api/test-boosts')
console.log()
console.log('Then test the boost links!')