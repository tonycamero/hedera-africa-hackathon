// app/api/recognition/definitions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { directHCSRecognitionService } from '@/lib/services/DirectHCSRecognitionService';
import { hcsRecognitionService } from '@/lib/services/HCSRecognitionService';

// Select service based on environment flag (defaulting to DirectHCS for better performance)
function getRecognitionService() {
  const useDirectService = process.env.NEXT_PUBLIC_RECOG_DIRECT !== 'false'; // Default to true
  console.log('[Recognition Definitions API] Using', useDirectService ? 'DirectHCS' : 'Legacy', 'recognition service');
  return useDirectService ? directHCSRecognitionService : hcsRecognitionService;
}

export async function GET(request: NextRequest) {
  try {
    const recognitionService = getRecognitionService();
    console.log('[Recognition Definitions API] Fetching definitions from HCS...');
    
    // Initialize the service
    await recognitionService.initialize();
    
    // Get all definitions directly from HCS
    const definitions = recognitionService.getAllDefinitions ? 
      recognitionService.getAllDefinitions() : 
      recognitionService.getDefinitions();
    
    // Process query parameters for filtering
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    let filteredDefinitions = definitions;
    
    // Apply category filter if provided
    if (category && ['social', 'academic', 'professional'].includes(category)) {
      filteredDefinitions = definitions.filter(def => def.category === category);
    }
    
    // Apply limit
    if (limit > 0) {
      filteredDefinitions = filteredDefinitions.slice(0, limit);
    }
    
    console.log(`[Recognition Definitions API] Retrieved ${filteredDefinitions.length}/${definitions.length} definitions from HCS`);
    
    return NextResponse.json({
      success: true,
      definitions: filteredDefinitions,
      total: definitions.length,
      filtered: filteredDefinitions.length,
      filters: {
        category: category || null,
        limit: limit
      },
      source: recognitionService === directHCSRecognitionService ? 'DirectHCS' : 'Legacy',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Recognition Definitions API] Failed to fetch definitions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recognition definitions from HCS',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}