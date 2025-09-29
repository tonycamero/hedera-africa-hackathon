// app/api/recognition/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { directHCSRecognitionService } from '@/lib/services/DirectHCSRecognitionService';
import { hcsRecognitionService } from '@/lib/services/HCSRecognitionService';

// Select service based on environment flag (defaulting to DirectHCS)
function getRecognitionService() {
  const useDirectService = process.env.NEXT_PUBLIC_RECOG_DIRECT !== 'false'; // Default to true
  console.log('[Recognition Debug API] Using', useDirectService ? 'DirectHCS' : 'Legacy', 'recognition service');
  return useDirectService ? directHCSRecognitionService : hcsRecognitionService;
}

export async function GET(request: NextRequest) {
  try {
    const recognitionService = getRecognitionService();
    const serviceType = recognitionService === directHCSRecognitionService ? 'DirectHCS' : 'Legacy';
    console.log(`[Recognition Debug API] Debugging ${serviceType} recognition service...`);
    
    // Initialize the service
    const initStart = Date.now();
    await recognitionService.initialize();
    const initTime = Date.now() - initStart;
    
    // Get debug information
    const debugInfo = recognitionService.getDebugInfo ? recognitionService.getDebugInfo() : {};
    
    // Get sample data
    const definitions = recognitionService.getAllDefinitions ? 
      recognitionService.getAllDefinitions() : 
      recognitionService.getDefinitions();
    
    // Test with demo user (try both variants)
    const testUserIds = ['tm-alex-chen', 'alex-chen-demo-session-2024'];
    let userInstances = [];
    let actualUserId = null;
    
    for (const userId of testUserIds) {
      const instances = recognitionService.getUserInstances ? 
        recognitionService.getUserInstances(userId) :
        recognitionService.getUserRecognitionInstances(userId);
      
      if (instances.length > 0) {
        userInstances = instances;
        actualUserId = userId;
        break;
      }
    }
    
    if (userInstances.length === 0) {
      // Try the first ID anyway for testing
      const userId = testUserIds[0];
      userInstances = recognitionService.getUserInstances ? 
        recognitionService.getUserInstances(userId) :
        recognitionService.getUserRecognitionInstances(userId);
      actualUserId = userId;
    }
    
    // Environment info
    const envInfo = {
      NEXT_PUBLIC_RECOG_DIRECT: process.env.NEXT_PUBLIC_RECOG_DIRECT,
      serviceSelection: process.env.NEXT_PUBLIC_RECOG_DIRECT !== 'false' ? 'DirectHCS' : 'Legacy'
    };
    
    // Sample definitions
    const sampleDefinitions = definitions.slice(0, 5).map(def => ({
      id: def.id,
      name: def.name,
      description: def.description?.substring(0, 100),
      category: def.category,
      icon: def.icon,
      rarity: def.rarity
    }));
    
    // Enriched user instances
    const enrichedInstances = userInstances.slice(0, 10).map(instance => {
      const definition = recognitionService.getDefinition ? 
        recognitionService.getDefinition(instance.definitionId) :
        recognitionService.getRecognitionDefinition(instance.definitionId);
      
      return {
        instanceId: instance.id,
        definitionId: instance.definitionId,
        definitionName: definition?.name || 'Unknown',
        owner: instance.owner,
        issuer: instance.issuer,
        note: instance.note
      };
    });
    
    return NextResponse.json({
      success: true,
      service: serviceType,
      environment: envInfo,
      performance: {
        initializationTime: `${initTime}ms`,
        timestamp: new Date().toISOString()
      },
      data: {
        definitionsCount: definitions.length,
        sampleDefinitions,
        testUser: actualUserId,
        testedUserIds: testUserIds,
        userInstancesCount: userInstances.length,
        sampleUserInstances: enrichedInstances
      },
      debug: debugInfo,
      apiEndpoints: [
        '/api/recognition',
        '/api/recognition/definitions',
        '/api/recognition/instances?owner=<user_id>',
        '/api/recognition/debug'
      ]
    });
    
  } catch (error) {
    console.error('[Recognition Debug API] Debug failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Recognition debug failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}