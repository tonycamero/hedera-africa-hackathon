// Simple test to verify recognition owner extraction fix
import { directHCSRecognitionService } from './lib/services/DirectHCSRecognitionService.ts';

async function testRecognitionFix() {
  console.log('🧪 Testing Recognition Owner Extraction Fix');
  console.log('============================================');
  
  try {
    // Initialize the service
    console.log('📡 Initializing DirectHCS Recognition Service...');
    await directHCSRecognitionService.initialize();
    
    // Test that we get definitions
    const definitions = directHCSRecognitionService.getAllDefinitions();
    console.log(`✅ Loaded ${definitions.length} recognition definitions`);
    
    if (definitions.length === 0) {
      console.log('❌ No definitions found - service may not be working');
      return false;
    }
    
    // Test with both Alex variants
    const alexVariants = ['tm-alex-chen', 'alex-chen-demo-session-2024'];
    
    for (const alexId of alexVariants) {
      console.log(`\n🔍 Testing user instances for: ${alexId}`);
      const instances = directHCSRecognitionService.getUserInstances(alexId);
      console.log(`  Found ${instances.length} instances`);
      
      if (instances.length > 0) {
        console.log('✅ SUCCESS - Found recognition instances!');
        instances.forEach((inst, i) => {
          const def = directHCSRecognitionService.getDefinition(inst.definitionId);
          console.log(`  ${i + 1}. ${def?.name || inst.definitionId} (owner: ${inst.owner}, issuer: ${inst.issuer})`);
        });
        return true;
      }
    }
    
    console.log('❌ No instances found for any Alex variant - may need more debugging');
    
    // Show some sample instances to debug
    const allInstances = directHCSRecognitionService.getAllInstances();
    console.log(`\n📋 Total instances in service: ${allInstances.length}`);
    
    if (allInstances.length > 0) {
      console.log('Sample instances:');
      allInstances.slice(0, 5).forEach((inst, i) => {
        const def = directHCSRecognitionService.getDefinition(inst.definitionId);
        console.log(`  ${i + 1}. ${def?.name || inst.definitionId} (owner: "${inst.owner}", issuer: ${inst.issuer})`);
      });
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testRecognitionFix().then(success => {
  console.log(`\n${success ? '🎉' : '💔'} Test ${success ? 'PASSED' : 'FAILED'}`);
  if (success) {
    console.log('The recognition grid should now show Alex\'s recognition tokens!');
  } else {
    console.log('The recognition system still needs more work.');
  }
}).catch(error => {
  console.error('Test runner failed:', error);
});