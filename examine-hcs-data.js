#!/usr/bin/env node

/**
 * Utility to examine all data on TrustMesh HCS topics
 * This helps understand what's already inscribed before making changes
 */

const MIRROR_URL = "https://testnet.mirrornode.hedera.com/api/v1";

const TOPICS = {
  RECOGNITION: "0.0.6895261",  
  CONTACTS_TRUST: "0.0.6896005",
  PROFILE: "0.0.6896008"
};

async function fetchAllMessages(topicId, limit = 1000) {
  console.log(`\n🔍 Examining topic ${topicId}...`);
  
  let allMessages = [];
  let nextUrl = `${MIRROR_URL}/topics/${topicId}/messages?limit=${Math.min(limit, 100)}&order=desc`;
  
  while (nextUrl && allMessages.length < limit) {
    console.log(`  Fetching batch... (${allMessages.length} so far)`);
    
    const res = await fetch(nextUrl);
    if (!res.ok) {
      console.error(`❌ Failed to fetch ${nextUrl}: ${res.status}`);
      break;
    }
    
    const data = await res.json();
    const messages = data.messages || [];
    
    for (const msg of messages) {
      try {
        const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        
        allMessages.push({
          sequenceNumber: msg.sequence_number,
          consensusTimestamp: msg.consensus_timestamp,
          topicId: msg.topic_id,
          decoded,
          parsed
        });
      } catch (e) {
        console.warn(`⚠️  Failed to parse message ${msg.sequence_number}: ${e.message}`);
        allMessages.push({
          sequenceNumber: msg.sequence_number,
          consensusTimestamp: msg.consensus_timestamp,
          topicId: msg.topic_id,
          decoded: Buffer.from(msg.message, 'base64').toString('utf-8'),
          parseError: e.message
        });
      }
    }
    
    // Check if there are more messages
    if (data.links && data.links.next) {
      nextUrl = `${MIRROR_URL}${data.links.next}`;
    } else {
      nextUrl = null;
    }
  }
  
  console.log(`✅ Loaded ${allMessages.length} messages from topic ${topicId}`);
  return allMessages.reverse(); // Reverse to get chronological order
}

function analyzeMessages(messages) {
  const stats = {
    total: messages.length,
    types: {},
    actors: {},
    timeRange: null,
    sampleMessages: []
  };
  
  for (const msg of messages) {
    if (!msg.parsed) continue;
    
    // Count message types
    const type = msg.parsed.type || 'UNKNOWN';
    stats.types[type] = (stats.types[type] || 0) + 1;
    
    // Count actors/from fields
    const actor = msg.parsed.from || msg.parsed.actor || 'UNKNOWN';
    stats.actors[actor] = (stats.actors[actor] || 0) + 1;
    
    // Track time range
    if (msg.consensusTimestamp) {
      const timestamp = new Date(parseFloat(msg.consensusTimestamp) * 1000);
      if (!stats.timeRange) {
        stats.timeRange = { earliest: timestamp, latest: timestamp };
      } else {
        if (timestamp < stats.timeRange.earliest) stats.timeRange.earliest = timestamp;
        if (timestamp > stats.timeRange.latest) stats.timeRange.latest = timestamp;
      }
    }
    
    // Collect sample messages (first 3 of each type)
    if (!stats.sampleMessages.find(s => s.type === type) || 
        stats.sampleMessages.filter(s => s.type === type).length < 3) {
      stats.sampleMessages.push({
        type,
        actor,
        timestamp: msg.consensusTimestamp,
        payload: msg.parsed.payload,
        sample: JSON.stringify(msg.parsed, null, 2).substring(0, 300) + '...'
      });
    }
  }
  
  return stats;
}

async function main() {
  console.log("🚀 TrustMesh HCS Data Examination Tool");
  console.log("=====================================");
  
  const allData = {};
  
  // Examine each topic
  for (const [name, topicId] of Object.entries(TOPICS)) {
    try {
      const messages = await fetchAllMessages(topicId, 500);
      const analysis = analyzeMessages(messages);
      
      allData[name] = {
        topicId,
        messages,
        analysis
      };
      
      console.log(`\n📊 Analysis for ${name} (${topicId}):`);
      console.log(`  Total messages: ${analysis.total}`);
      console.log(`  Message types:`, Object.entries(analysis.types).map(([k,v]) => `${k}: ${v}`).join(', '));
      console.log(`  Unique actors: ${Object.keys(analysis.actors).length}`);
      
      if (analysis.timeRange) {
        console.log(`  Time range: ${analysis.timeRange.earliest.toISOString()} to ${analysis.timeRange.latest.toISOString()}`);
      }
      
      console.log(`  Sample messages:`);
      for (const sample of analysis.sampleMessages.slice(0, 2)) {
        console.log(`    ${sample.type} from ${sample.actor}:`);
        console.log(`      ${sample.sample.replace(/\n/g, '\n      ')}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to examine ${name} (${topicId}):`, error.message);
      allData[name] = { topicId, error: error.message };
    }
  }
  
  console.log("\n📋 Summary Report");
  console.log("=================");
  
  let totalMessages = 0;
  const allTypes = new Set();
  const allActors = new Set();
  
  for (const [name, data] of Object.entries(allData)) {
    if (data.analysis) {
      totalMessages += data.analysis.total;
      Object.keys(data.analysis.types).forEach(t => allTypes.add(t));
      Object.keys(data.analysis.actors).forEach(a => allActors.add(a));
    }
  }
  
  console.log(`Total messages across all topics: ${totalMessages}`);
  console.log(`Unique message types: ${Array.from(allTypes).join(', ')}`);
  console.log(`Unique actors: ${allActors.size}`);
  console.log(`Active topics: ${Object.values(allData).filter(d => d.analysis && d.analysis.total > 0).length}/${Object.keys(TOPICS).length}`);
  
  // Look for schema patterns
  console.log("\n🔍 Schema Analysis:");
  const hasCanonicalSchema = Array.from(allTypes).some(t => 
    ['contact', 'trust', 'signal'].includes(t) && 
    totalMessages > 0
  );
  
  const hasLegacySchema = Array.from(allTypes).some(t => 
    ['RECOGNITION_DEFINITION', 'TRUST_ALLOCATE', 'CONTACT_REQUEST'].includes(t)
  );
  
  console.log(`  Uses canonical HCS schema (v1): ${hasCanonicalSchema ? '✅' : '❌'}`);
  console.log(`  Uses legacy envelope schema: ${hasLegacySchema ? '✅' : '❌'}`);
  
  if (hasLegacySchema && !hasCanonicalSchema) {
    console.log("\n⚠️  MIGRATION NEEDED: Data is using legacy schema format");
    console.log("   Consider migrating to canonical HCS events or maintaining compatibility");
  }
  
  console.log("\n✨ Examination complete!");
}

main().catch(console.error);