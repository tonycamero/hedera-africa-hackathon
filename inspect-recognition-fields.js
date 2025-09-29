// Quick inspection of recognition message fields
console.log('🔍 Inspecting Recognition Message Fields');
console.log('========================================');

async function inspectRecognitionFields() {
  try {
    const topic = "0.0.6895261"; // Recognition topic
    const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topic}/messages?limit=100&order=desc`;
    
    console.log(`📡 Fetching from: ${url}`);
    const response = await fetch(url);
    const json = await response.json();
    
    // Try to decode and parse each message
    const decoded = (msg) => {
      try {
        const txt = Buffer.from(msg.message, 'base64').toString('utf8');
        return JSON.parse(txt);
      } catch (e) { 
        return null; 
      }
    };
    
    const rows = (json.messages || []).map(m => ({
      ts: m.consensus_timestamp, 
      p: decoded(m)
    })).filter(x => x.p);

    console.log(`📋 Total decoded messages: ${rows.length}`);

    // Look at "mint/instance" types only
    const inst = rows.filter(x => {
      const type = (x.p.type || "").toLowerCase();
      return type.includes("recognition") && (type.includes("mint") || type.includes("instance"));
    });
    
    console.log(`🏆 Instance candidates: ${inst.length}`);
    console.log('Sample instance messages:');
    inst.slice(0, 5).forEach((x, i) => {
      console.log(`  ${i + 1}. Type: ${x.p.type}, Keys: [${Object.keys(x.p).join(', ')}]`);
    });

    // See which keys exist across instance payloads
    const keys = new Set();
    inst.forEach(x => Object.keys(x.p).forEach(k => keys.add(k)));
    console.log(`\n🔑 Top-level keys seen: [${[...keys].join(', ')}]`);

    // Also check nested metadata keys if present
    const metaKeys = new Set();
    inst.forEach(x => x.p.metadata && Object.keys(x.p.metadata).forEach(k => metaKeys.add(k)));
    console.log(`🔗 Metadata keys seen: [${[...metaKeys].join(', ')}]`);

    // Try to see what values look like for likely owner fields
    console.log('\n👤 Owner field analysis:');
    const sample = inst.slice(0, 10).map(x => {
      const result = {
        type: x.p.type,
        owner: x.p.owner,
        recipient: x.p.recipient,
        to: x.p.to,
        target: x.p.target,
        subject: x.p.subject,
        holder: x.p.holder
      };
      
      // Check metadata too
      if (x.p.metadata) {
        result.metaOwner = x.p.metadata.owner;
        result.metaTo = x.p.metadata.to;
        result.metaTarget = x.p.metadata.target;
      }
      
      return result;
    });
    
    console.table(sample);
    
    // Look for Alex specifically
    console.log('\n🎯 Looking for Alex (tm-alex-chen) in messages:');
    const alexMessages = rows.filter(x => {
      const str = JSON.stringify(x.p).toLowerCase();
      return str.includes('alex') || str.includes('tm-alex');
    });
    
    console.log(`Found ${alexMessages.length} messages mentioning Alex:`);
    alexMessages.slice(0, 3).forEach((x, i) => {
      console.log(`  ${i + 1}. ${x.p.type}: ${JSON.stringify(x.p, null, 2).substring(0, 200)}...`);
    });
    
    return {
      totalMessages: rows.length,
      instanceCandidates: inst.length,
      topLevelKeys: [...keys],
      metadataKeys: [...metaKeys],
      alexMessages: alexMessages.length
    };
    
  } catch (error) {
    console.error('❌ Inspection failed:', error);
    return { error: error.message };
  }
}

// Run if in browser environment or via Node
if (typeof window !== 'undefined') {
  // Browser environment
  window.inspectRecognitionFields = inspectRecognitionFields;
  console.log('💡 Run inspectRecognitionFields() in browser console');
} else {
  // Node environment
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    return inspectRecognitionFields();
  }).then(result => {
    console.log('\n📊 Results:', JSON.stringify(result, null, 2));
  }).catch(error => {
    console.error('Failed:', error);
  });
}
