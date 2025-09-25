/**
 * Mint recognition tokens for Alex Chen using our working HCS system
 */

require('dotenv').config({ path: '.env.local' })

async function mintRecognitionForAlex() {
  const alexId = "tm-alex-chen" // Match the client-generated session ID
  
  // Recognition tokens to mint for Alex
  const recognitionTokens = [
    {
      definitionId: "prof-fav",
      recognition: "Prof Fav", 
      name: "Prof Fav",
      mintedBy: "demo-system"
    },
    {
      definitionId: "code-monkey",
      recognition: "Code Monkey",
      name: "Code Monkey", 
      mintedBy: "demo-system"
    },
    {
      definitionId: "note-taker",
      recognition: "Note Taker",
      name: "Note Taker",
      mintedBy: "demo-system"
    }
  ]
  
  console.log(`🎯 Minting ${recognitionTokens.length} recognition tokens for Alex Chen...`)
  
  let nonce = Math.floor(Date.now() / 1000)
  
  for (const token of recognitionTokens) {
    try {
      const payload = {
        type: "RECOGNITION_MINT",
        from: "0.0.5864559", // Our server account
        nonce: nonce++,
        ts: Math.floor(Date.now() / 1000),
        payload: {
          to: alexId,
          recognition: token.recognition,
          name: token.name,
          mintedBy: token.mintedBy,
          definitionId: token.definitionId
        }
      }
      
      console.log(`\nMinting: ${token.name}`)
      console.log(`Payload:`, JSON.stringify(payload, null, 2))
      
      // Use fetch to call our working HCS submit endpoint
      const response = await fetch('http://localhost:3000/api/hcs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      
      if (result.ok) {
        console.log(`✅ ${token.name} minted successfully!`)
        console.log(`   Topic: ${result.topicId}`)
        console.log(`   Sequence: ${result.sequenceNumber}`)
        console.log(`   Transaction: ${result.transactionId}`)
      } else {
        console.error(`❌ Failed to mint ${token.name}:`, result.error)
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`❌ Error minting ${token.name}:`, error.message)
    }
  }
  
  console.log('\n🎉 Recognition minting complete!')
  console.log('\n📋 Next steps:')
  console.log('1. Check Mirror Node for new messages')
  console.log('2. Visit /circle to see recognition tokens appear')
  console.log('3. Visit /recognition to see full collection')
}

if (require.main === module) {
  mintRecognitionForAlex().catch(console.error)
}

module.exports = { mintRecognitionForAlex }