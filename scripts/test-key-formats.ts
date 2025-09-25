// Test different key parsing methods
require('dotenv').config({ path: '.env.local' })
const { PrivateKey } = require('@hashgraph/sdk')

const operatorKey = process.env.HEDERA_OPERATOR_KEY

console.log(`Testing key formats for: ${operatorKey}`)
console.log(`Key length: ${operatorKey?.length} chars`)

// Method 1: fromString (current)
try {
  const pk1 = PrivateKey.fromString(operatorKey)
  console.log(`✅ fromString worked`)
  console.log(`  Public key: ${pk1.publicKey.toStringDer()}`)
} catch (error: any) {
  console.log(`❌ fromString failed: ${error.message}`)
}

// Method 2: fromStringDer
try {
  const pk2 = PrivateKey.fromStringDer(operatorKey)
  console.log(`✅ fromStringDer worked`)
  console.log(`  Public key: ${pk2.publicKey.toStringDer()}`)
} catch (error: any) {
  console.log(`❌ fromStringDer failed: ${error.message}`)
}

// Method 3: fromStringECDSA (if available)
try {
  const pk3 = PrivateKey.fromStringECDSA ? PrivateKey.fromStringECDSA(operatorKey) : null
  if (pk3) {
    console.log(`✅ fromStringECDSA worked`)
    console.log(`  Public key: ${pk3.publicKey.toStringDer()}`)
  } else {
    console.log(`❌ fromStringECDSA not available`)
  }
} catch (error: any) {
  console.log(`❌ fromStringECDSA failed: ${error.message}`)
}

// Method 4: Try as hex without DER wrapper
if (operatorKey?.length === 64) {
  try {
    const pk4 = PrivateKey.fromString(operatorKey)
    console.log(`✅ Raw hex parsing worked`)
    console.log(`  Public key: ${pk4.publicKey.toStringDer()}`)
  } catch (error: any) {
    console.log(`❌ Raw hex parsing failed: ${error.message}`)
  }
}