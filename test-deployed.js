// 🎯 Quick test script for deployed app
// Run this in console on https://trust-mesh-hackathon-80s51szca.vercel.app/circle

console.log('🚀 Testing deployed recognition system...');

// 1. Check if debug helpers are available
if (window.debugStore?.recognitionDebug) {
  const recInfo = window.debugStore.recognitionDebug();
  console.log('✅ Recognition Service Debug Info:', recInfo);
  
  if (recInfo.definitionsCount > 0) {
    console.log('🎉 SUCCESS: Definitions cache populated!', recInfo.definitionIds);
  } else {
    console.log('⚠️ WARNING: Definitions cache still empty');
  }
  
  if (recInfo.pendingInstancesCount === 0) {
    console.log('✅ All instances resolved successfully');
  } else {
    console.log('⚠️ Still have pending instances:', recInfo.pendingInstancesCount);
  }
} else {
  console.log('⚠️ Debug helpers not available yet');
}

// 2. Check SignalsStore for recognition events
if (window.signalsStore) {
  const allSignals = window.signalsStore.getAllSignals();
  const recognitionSignals = allSignals.filter(s => s.type === 'recognition_mint');
  
  console.log('📊 Signals Summary:', {
    totalSignals: allSignals.length,
    recognitionSignals: recognitionSignals.length,
    sampleTypes: [...new Set(allSignals.map(s => s.type))].slice(0, 5)
  });
  
  if (recognitionSignals.length > 0) {
    console.log('🏆 Recognition signals found:', recognitionSignals.map(s => ({
      owner: s.payload?.owner,
      definitionName: s.payload?.definitionName,
      definitionId: s.payload?.definitionId
    })));
  }
}

console.log('📋 Test complete! Check the logs above for results.');