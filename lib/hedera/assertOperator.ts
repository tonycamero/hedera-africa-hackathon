import { Client, AccountId, PrivateKey, AccountInfoQuery } from '@hashgraph/sdk'

export async function assertOperatorMatchesKey(
  network: 'testnet' | 'mainnet' = 'testnet'
) {
  const id = process.env.HEDERA_OPERATOR_ID
  const keyStr = process.env.HEDERA_OPERATOR_KEY
  
  if (!id || !keyStr) {
    throw new Error('Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY in environment')
  }

  const client = network === 'testnet' ? Client.forTestnet() : Client.forMainnet()

  // Accept both DER and hex; normalize
  let priv: PrivateKey
  try {
    if (keyStr.startsWith('0x')) {
      priv = PrivateKey.fromStringECDSA(keyStr.slice(2))
    } else if (keyStr.length > 64) {
      priv = PrivateKey.fromStringDer(keyStr)
    } else {
      priv = PrivateKey.fromString(keyStr)
    }
  } catch (error) {
    throw new Error(`HEDERA_OPERATOR_KEY format invalid (not DER or hex): ${error}`)
  }

  client.setOperator(AccountId.fromString(id), priv)

  try {
    const info = await new AccountInfoQuery().setAccountId(id).execute(client)
    const chainPub = info.key?.toStringDer()
    const localPub = priv.publicKey.toStringDer()
    
    if (chainPub !== localPub) {
      throw new Error(
        `❌ Operator key mismatch for ${id}.\n` +
        `On-chain pubkey: ${chainPub}\n` +
        `Env-derived pubkey: ${localPub}\n` +
        `This is why you see INVALID_SIGNATURE. Use the correct private key for ${id} ` +
        `or switch HEDERA_OPERATOR_ID to the account that matches your key.`
      )
    }
    
    console.log(`✅ [Hedera] Operator validated: ${id}`)
    console.log(`   Public key: ${chainPub}`)
    return { id, chainPub }
  } finally {
    client.close()
  }
}
