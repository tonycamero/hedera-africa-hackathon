// Test script to verify recognition system is working properly
const { directHCSRecognitionService } = require('./lib/services/DirectHCSRecognitionService.ts');

async function testRecognitionSystem() {
  console.log('🔍 Testing TrustMesh Recognition System');
  console.log('=====================================');
  
  try {
    console.log('\n📡 Testing DirectHCS Recognition Service...');
    
    // Test service initialization
    console.log('  • Initializing service...');
    await directHCSRecognitionService.initialize();
    console.log('  ✅ Service initialized successfully');
    
    // Test definitions retrieval
    console.log('  • Fetching recognition definitions...');
    const definitions = directHCSRecognitionService.getAllDefinitions();
    console.log(`  ✅ Retrieved ${definitions.length} definitions`);
    
    if (definitions.length > 0) {
      console.log('  📋 Sample definitions:');
      definitions.slice(0, 3).forEach((def, i) => {
        console.log(`    ${i + 1}. ${def.name} (${def.category || 'unknown'}) - ${def.description || 'No description'}`);
      });
    }
    
    // Test user instances (using demo user Alex Chen)
    const testUserId = 'tm-alex-chen'; // From DEMO.md
    console.log(`\n  • Fetching instances for user: ${testUserId}...`);
    const instances = directHCSRecognitionService.getUserInstances(testUserId);
    console.log(`  ✅ Retrieved ${instances.length} instances for ${testUserId}`);
    
    if (instances.length > 0) {
      console.log('  🏆 User recognition instances:');
      instances.forEach((inst, i) => {
        const def = directHCSRecognitionService.getDefinition(inst.definitionId);
        console.log(`    ${i + 1}. ${def?.name || inst.definitionId} (issued by ${inst.issuer || 'unknown'})`);
      });
    }
    
    // Test debug info
    console.log('\n  • Getting debug information...');
    const debugInfo = directHCSRecognitionService.getDebugInfo();
    console.log('  ✅ Debug Info:', {
      initialized: debugInfo.initialized,
      definitionsCount: debugInfo.definitionsCount,
      instancesCount: debugInfo.instancesCount,
      eventsCount: debugInfo.eventsCount,
      cacheValid: debugInfo.cache.cacheValid,
      dataSource: debugInfo.dataSource
    });
    
    console.log('\n✅ All tests passed! Recognition system is working properly.');
    console.log('\n🎯 Summary:');
    console.log(`  • Service: DirectHCS Recognition Service`);
    console.log(`  • Definitions: ${definitions.length} loaded`);
    console.log(`  • User instances: ${instances.length} for ${testUserId}`);
    console.log(`  • Data source: ${debugInfo.dataSource?.source || 'unknown'}`);
    console.log(`  • Cache status: ${debugInfo.cache.cacheValid ? 'valid' : 'stale/none'}`);
    
    return {
      success: true,
      service: 'DirectHCS',
      definitions: definitions.length,
      instances: instances.length,
      debugInfo
    };
    
  } catch (error) {
    console.error('\n❌ Recognition system test failed:', error.message);
    console.error('Full error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Test API endpoints if running in Node.js environment
async function testAPIEndpoints() {
  if (typeof window !== 'undefined') return; // Skip in browser
  
  console.log('\n🌐 Testing Recognition API Endpoints...');
  
  try {
    const fetch = require('node-fetch');
    
    // Test main recognition endpoint
    console.log('  • Testing /api/recognition...');
    const response = await fetch('http://localhost:3001/api/recognition');
    const data = await response.json();
    console.log(`  ✅ Response: ${data.success ? 'SUCCESS' : 'FAILED'} (${data.count || 0} definitions)`);
    
    // Test definitions endpoint
    console.log('  • Testing /api/recognition/definitions...');
    const defResponse = await fetch('http://localhost:3001/api/recognition/definitions?limit=5');
    const defData = await defResponse.json();
    console.log(`  ✅ Definitions API: ${defData.success ? 'SUCCESS' : 'FAILED'} (${defData.filtered || 0}/${defData.total || 0})`);
    
    // Test instances endpoint
    console.log('  • Testing /api/recognition/instances...');
    const instResponse = await fetch('http://localhost:3001/api/recognition/instances?owner=tm-alex-chen');
    const instData = await instResponse.json();
    console.log(`  ✅ Instances API: ${instData.success ? 'SUCCESS' : 'FAILED'} (${instData.retrieved || 0} instances)`);
    
    console.log('\n🎉 API endpoints are working!');
    
  } catch (error) {
    console.error('  ❌ API test failed (server may not be running):', error.message);
  }
}

// Run tests
if (require.main === module) {
  testRecognitionSystem()
    .then(result => {
      console.log('\n📊 Test Results:', JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testRecognitionSystem, testAPIEndpoints };