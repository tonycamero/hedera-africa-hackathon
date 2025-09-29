// app/api/recognition/instances/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { directHCSRecognitionService } from '@/lib/services/DirectHCSRecognitionService';
import { hcsRecognitionService } from '@/lib/services/HCSRecognitionService';

// Select service based on environment flag (defaulting to DirectHCS for better performance)
function getRecognitionService() {
  const useDirectService = process.env.NEXT_PUBLIC_RECOG_DIRECT !== 'false'; // Default to true
  console.log('[Recognition Instances API] Using', useDirectService ? 'DirectHCS' : 'Legacy', 'recognition service');
  return useDirectService ? directHCSRecognitionService : hcsRecognitionService;
}

export async function GET(request: NextRequest) {
  try {
    const recognitionService = getRecognitionService();
    console.log('[Recognition Instances API] Fetching instances from HCS...');
    
    // Initialize the service
    await recognitionService.initialize();
    
    // Process query parameters
    const url = new URL(request.url);
    const owner = url.searchParams.get('owner');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    if (!owner) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: owner',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Get user instances directly from HCS
    const instances = recognitionService.getUserInstances ? 
      recognitionService.getUserInstances(owner) :
      recognitionService.getUserRecognitionInstances(owner);
    
    // Apply limit
    const limitedInstances = limit > 0 ? instances.slice(0, limit) : instances;
    
    // Enrich instances with definition data
    const enrichedInstances = limitedInstances.map(instance => {
      const definition = recognitionService.getDefinition ? 
        recognitionService.getDefinition(instance.definitionId) :
        recognitionService.getRecognitionDefinition(instance.definitionId);
      
      return {
        ...instance,
        definition: definition ? {
          id: definition.id,
          name: definition.name,
          description: definition.description,
          icon: definition.icon,
          category: definition.category,
          rarity: definition.rarity
        } : null
      };
    });
    
    console.log(`[Recognition Instances API] Retrieved ${enrichedInstances.length}/${instances.length} instances for ${owner} from HCS`);
    
    return NextResponse.json({
      success: true,
      instances: enrichedInstances,
      owner,
      total: instances.length,
      retrieved: enrichedInstances.length,
      source: recognitionService === directHCSRecognitionService ? 'DirectHCS' : 'Legacy',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Recognition Instances API] Failed to fetch instances:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recognition instances from HCS',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}