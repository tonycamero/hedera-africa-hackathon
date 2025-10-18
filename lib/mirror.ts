const BASE = "https://testnet.mirrornode.hedera.com";

export async function readTopic(topicId: string, limit = 2000) {
  const url = `${BASE}/api/v1/topics/${topicId}/messages?limit=${limit}`;
  
  try {
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();
    
    return (data.messages || []).map((m: any) => {
      try {
        const messageStr = Buffer.from(m.message, "base64").toString("utf-8");
        return JSON.parse(messageStr);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error("Failed to read topic:", topicId, error);
    return [];
  }
}