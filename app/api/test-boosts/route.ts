import { NextResponse } from 'next/server'
import { signalsStore } from '@/lib/stores/signalsStore'

const demoSignals = [
  {
    "id": "demo-boost-1",
    "type": "GENZ_SIGNAL",
    "actor": "tm-alex-chen",
    "target": "tm-sarah-kim",
    "ts": 1760378359887,
    "metadata": {
      "boostId": "60b7e2e023d0ee6d",
      "template": "That presentation was ___",
      "fill": "absolutely killer! The investors were nodding the whole time 🔥",
      "note": "Seriously, you had them eating out of your palm. That's how you close deals!",
      "senderHandle": "alex.chen",
      "recipientHandle": "sarah.kim",
      "templateId": "genz-demo-1",
      "category": "GenZ Recognition",
      "rarity": "Epic",
      "lens": "genz"
    }
  },
  {
    "id": "demo-boost-2",
    "type": "GENZ_SIGNAL",
    "actor": "tm-maya-patel",
    "target": "tm-alex-chen",
    "ts": 1760374759888,
    "metadata": {
      "boostId": "00169e15c6aacfc2",
      "template": "Your ___ game is unmatched",
      "fill": "coding during the hackathon - shipped 3 features while we were still reading docs",
      "note": "Watched you debug that API integration in 10 minutes. Pure wizardry! 🧙‍♂️",
      "senderHandle": "maya.creates",
      "recipientHandle": "alex.chen",
      "templateId": "genz-demo-2",
      "category": "GenZ Recognition",
      "rarity": "Epic",
      "lens": "genz"
    }
  },
  {
    "id": "demo-boost-3",
    "type": "GENZ_SIGNAL",
    "actor": "tm-jordan-lee",
    "target": "tm-maya-patel",
    "ts": 1760371159888,
    "metadata": {
      "boostId": "26ce4a8ff8eb608f",
      "template": "That was ___ energy",
      "fill": "pure main character - walked into that networking event like you owned the place",
      "note": "Everyone wanted to talk to you. That's what confidence looks like!",
      "senderHandle": "jordan.social",
      "recipientHandle": "maya.creates",
      "templateId": "genz-demo-3",
      "category": "GenZ Recognition",
      "rarity": "Epic",
      "lens": "genz"
    }
  },
  {
    "id": "demo-boost-4",
    "type": "GENZ_SIGNAL",
    "actor": "tm-sam-rivera",
    "target": "tm-jordan-lee",
    "ts": 1760367559888,
    "metadata": {
      "boostId": "f21a7a683d0934a4",
      "template": "You absolutely ___",
      "fill": "saved our demo with that last-minute fix. Crisis averted like a pro!",
      "note": "1 hour before demo, everything broke. You fixed it in 20 minutes. Legend.",
      "senderHandle": "sam.builds",
      "recipientHandle": "jordan.social",
      "templateId": "genz-demo-4",
      "category": "GenZ Recognition",
      "rarity": "Epic",
      "lens": "genz"
    }
  }
]

export async function POST() {
  try {
    // Add demo signals to the store
    demoSignals.forEach(signal => {
      signalsStore.add(signal as any)
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
