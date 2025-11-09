import { Client, AccountId, PrivateKey, TransferTransaction, TokenId, TokenAssociateTransaction } from '@hashgraph/sdk'

async function sendTRST() {
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!)
  const operatorKey = PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!)
  const tokenId = TokenId.fromString(process.env.NEXT_PUBLIC_TRST_TOKEN_ID!)
  
  const client = Client.forTestnet()
  client.setOperator(operatorId, operatorKey)
  
  const recipientId = AccountId.fromString('0.0.7142856')
  const amount = 135 // 1.35 TRST (assuming 2 decimals, so 135 base units)
  
  console.log(`[TRST] Step 1: Associating token ${tokenId.toString()} with ${recipientId.toString()}`)
  
  try {
    // Step 1: Associate token with recipient (operator pays fee)
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(recipientId)
      .setTokenIds([tokenId])
      .freezeWith(client)
    
    // Operator signs and pays for association
    const associateSigned = await associateTx.sign(operatorKey)
    const associateResponse = await associateSigned.execute(client)
    const associateReceipt = await associateResponse.getReceipt(client)
    
    console.log(`[TRST] Association status: ${associateReceipt.status.toString()}`)
  } catch (e: any) {
    if (e.message?.includes('TOKEN_ALREADY_ASSOCIATED')) {
      console.log(`[TRST] Token already associated (OK)`)
    } else {
      throw e
    }
  }
  
  console.log(`[TRST] Step 2: Sending ${amount / 100} TRST to ${recipientId.toString()}`)
  console.log(`[TRST] From: ${operatorId.toString()}`)
  
  const transaction = await new TransferTransaction()
    .addTokenTransfer(tokenId, operatorId, -amount)
    .addTokenTransfer(tokenId, recipientId, amount)
    .freezeWith(client)
    .sign(operatorKey)
  
  const response = await transaction.execute(client)
  const receipt = await response.getReceipt(client)
  
  console.log(`[TRST Transfer] Status: ${receipt.status.toString()}`)
  console.log(`[TRST Transfer] Transaction ID: ${response.transactionId.toString()}`)
  
  client.close()
}

sendTRST().catch(console.error)
