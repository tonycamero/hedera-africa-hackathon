#!/usr/bin/env node
/**
 * Create Demo Boost Links for Team Evaluation
 * Run: node create-demo-boosts.js
 */

const crypto = require('crypto')

function createBoostId(sender, recipient, template, fill, timestamp) {
  const input = `${sender}:${recipient}:${template}:${fill}:${timestamp}`
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)
}

// Demo scenarios for team evaluation
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

console.log('🚀 TrustMesh Boost Demo Links for Team Evaluation')
console.log('=' .repeat(60))
console.log()

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'https://trust-mesh-hackathon-ly67xp8hy.vercel.app'

console.log(`🌐 Base URL: ${baseUrl}`)
console.log()

demoScenarios.forEach((scenario, i) => {
  const timestamp = Date.now() - (i * 3600000) // Stagger by hours
  const boostId = createBoostId(
    scenario.sender, 
    scenario.recipient, 
    scenario.template, 
    scenario.fill, 
    timestamp
  )
  
  const fullText = scenario.template.replace('___', scenario.fill)
  const boostUrl = `${baseUrl}/boost/${boostId}`
  
  console.log(`${i + 1}. ${scenario.title}`)
  console.log(`   🔗 ${boostUrl}`)
  console.log(`   💬 "${fullText}"`)
  console.log(`   👥 from @${scenario.senderHandle} to @${scenario.recipientHandle}`)
  if (scenario.note) {
    console.log(`   📝 "${scenario.note}"`)
  }
  console.log()
})

console.log('📱 Social Media Share Text:')
console.log('="Check out this GenZ signal boost! 🔥⚡ #TrustMesh #GenZ #Web3Social"')
console.log()
console.log('🧪 Testing Instructions:')
console.log('1. Click each link on mobile/desktop')
console.log('2. Test boost button (anonymous, no signup required)')  
console.log('3. Test suggest button (shows template picker)')
console.log('4. Test share button (Web Share API or clipboard)')
console.log('5. Check social media preview (OpenGraph/Twitter cards)')
console.log()
console.log('Note: These are demo IDs - actual signals would be in the HCS store')