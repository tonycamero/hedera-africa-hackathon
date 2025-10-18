import { 
  Client, 
  TopicId, 
  TopicMessageSubmitTransaction, 
  AccountId, 
  PrivateKey 
} from "@hashgraph/sdk";

export function hederaClient() {
  const client = Client.forName(process.env.HEDERA_NETWORK || "testnet");
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_OPERATOR_ID!), 
    PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!)
  );
  return client;
}

export async function hcsPublish(obj: object): Promise<string> {
  const client = hederaClient();
  
  try {
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(process.env.HEDERA_TOPIC_ID!))
      .setMessage(Buffer.from(JSON.stringify(obj)))
      .execute(client);
      
    await tx.getReceipt(client);
    return tx.transactionId.toString();
  } finally {
    client.close();
  }
}

export function hcsEnvelope(type: string, actor: string, payload: any) {
  return { 
    v: 1, 
    type, 
    ts: Date.now(), 
    actor, 
    payload 
  };
}